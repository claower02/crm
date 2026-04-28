package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type Attachment struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Size int64  `json:"size"`
	Kind string `json:"kind"`
}

type ChatMessage struct {
	ID         string `json:"id"`
	Author     string `json:"author"`
	Text       string `json:"text"`
	At         string `json:"at"`
	FromClient bool   `json:"fromClient,omitempty"`
}

type Deal struct {
	ID          int           `json:"id"`
	Status      string        `json:"status"`
	Client      string        `json:"client"`
	Phone       string        `json:"phone"`
	City        string        `json:"city"`
	Service     string        `json:"service"`
	Address     string        `json:"address,omitempty"`
	Comment     string        `json:"comment"`
	Responsible string        `json:"responsible"`
	CreatedAt   string        `json:"createdAt"`
	UpdatedAt   string        `json:"updatedAt"`
	Source      string        `json:"source"`
	Amount      float64       `json:"amount,omitempty"`
	Attachments []Attachment  `json:"attachments"`
	Chat        []ChatMessage `json:"chat"`
	Unread      int           `json:"unread"`
}

var (
	deals  []Deal
	mu     sync.RWMutex
	dataFile = "data.json"
)

func main() {
	loadDeals()

	r := gin.Default()

	// CORS middleware
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	api := r.Group("/api")
	{
		api.GET("/deals", getDeals)
		api.POST("/deals", createDeal)
		api.PUT("/deals/:id", updateDeal)
		api.POST("/deals/:id/move", moveDeal)
		api.DELETE("/deals/:id", deleteDeal)
	}

	// Serve static files from React build
	r.Static("/assets", "./dist/assets")
	r.Static("/sounds", "./dist/sounds")
	
	r.NoRoute(func(c *gin.Context) {
		// If it's an API call that doesn't exist, return 404
		// Otherwise serve index.html for SPA routing
		path := c.Request.URL.Path
		if len(path) >= 4 && path[:4] == "/api" {
			c.JSON(http.StatusNotFound, gin.H{"error": "API route not found"})
			return
		}
		c.File("./dist/index.html")
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	fmt.Printf("Server started at http://localhost:%s\n", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}

func loadDeals() {
	file, err := os.ReadFile(dataFile)
	if err != nil {
		if os.IsNotExist(err) {
			deals = []Deal{} // Start empty if no file
			return
		}
		log.Fatal(err)
	}
	if err := json.Unmarshal(file, &deals); err != nil {
		log.Fatal(err)
	}
}

func saveDeals() {
	data, err := json.MarshalIndent(deals, "", "  ")
	if err != nil {
		log.Println("Error marshaling deals:", err)
		return
	}
	if err := os.WriteFile(dataFile, data, 0644); err != nil {
		log.Println("Error writing data file:", err)
	}
}

func getDeals(c *gin.Context) {
	mu.RLock()
	defer mu.RUnlock()
	
	// Ensure nil slices are returned as empty arrays [] instead of null
	safeDeals := make([]Deal, len(deals))
	copy(safeDeals, deals)
	for i := range safeDeals {
		ensureSlices(&safeDeals[i])
	}
	
	c.JSON(http.StatusOK, safeDeals)
}

func createDeal(c *gin.Context) {
	var newDeal Deal
	if err := c.ShouldBindJSON(&newDeal); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	mu.Lock()
	defer mu.Unlock()

	// Simple ID generation
	maxID := 0
	for _, d := range deals {
		if d.ID > maxID {
			maxID = d.ID
		}
	}
	newDeal.ID = maxID + 1
	newDeal.CreatedAt = time.Now().Format(time.RFC3339)
	newDeal.UpdatedAt = newDeal.CreatedAt

	ensureSlices(&newDeal)
	deals = append([]Deal{newDeal}, deals...) // Add to top
	saveDeals()

	c.JSON(http.StatusCreated, newDeal)
}

func ensureSlices(d *Deal) {
	if d.Attachments == nil {
		d.Attachments = []Attachment{}
	}
	if d.Chat == nil {
		d.Chat = []ChatMessage{}
	}
}

func updateDeal(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var updatedDeal Deal
	if err := c.ShouldBindJSON(&updatedDeal); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	mu.Lock()
	defer mu.Unlock()

	for i, d := range deals {
		if d.ID == id {
			updatedDeal.ID = id
			updatedDeal.UpdatedAt = time.Now().Format(time.RFC3339)
			ensureSlices(&updatedDeal)
			deals[i] = updatedDeal
			saveDeals()
			c.JSON(http.StatusOK, updatedDeal)
			return
		}
	}

	c.JSON(http.StatusNotFound, gin.H{"error": "Deal not found"})
}

func moveDeal(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var body struct {
		Status string `json:"status"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	mu.Lock()
	defer mu.Unlock()

	for i, d := range deals {
		if d.ID == id {
			deals[i].Status = body.Status
			deals[i].UpdatedAt = time.Now().Format(time.RFC3339)
			ensureSlices(&deals[i])
			saveDeals()
			c.JSON(http.StatusOK, deals[i])
			return
		}
	}

	c.JSON(http.StatusNotFound, gin.H{"error": "Deal not found"})
}

func deleteDeal(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))

	mu.Lock()
	defer mu.Unlock()

	for i, d := range deals {
		if d.ID == id {
			deals = append(deals[:i], deals[i+1:]...)
			saveDeals()
			c.Status(http.StatusNoContent)
			return
		}
	}

	c.JSON(http.StatusNotFound, gin.H{"error": "Deal not found"})
}
