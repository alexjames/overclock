package main

import (
	"encoding/json"
	"log"
	"math/rand"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

func main() {
	dataDir := os.Getenv("DATA_DIR")
	if dataDir == "" {
		dataDir = "/data"
	}
	coursesDir := filepath.Join(dataDir, "courses")

	// Load the courses index (returned by /beta/v1/courses).
	indexPath := filepath.Join(coursesDir, "courses_index.json")
	indexRaw, err := os.ReadFile(indexPath)
	if err != nil {
		log.Fatalf("failed to read %s: %v", indexPath, err)
	}

	// Validate it's valid JSON.
	var indexCheck []map[string]interface{}
	if err := json.Unmarshal(indexRaw, &indexCheck); err != nil {
		log.Fatalf("failed to parse %s: %v", indexPath, err)
	}
	coursesJSON := indexRaw

	// Load all other JSON files in the data directory as individual course files.
	courseByID := make(map[string]map[string]interface{})

	entries, err := os.ReadDir(coursesDir)
	if err != nil {
		log.Fatalf("failed to read courses directory %s: %v", coursesDir, err)
	}

	for _, entry := range entries {
		name := entry.Name()
		if entry.IsDir() || !strings.HasSuffix(name, ".json") || name == "courses_index.json" {
			continue
		}

		filePath := filepath.Join(coursesDir, name)
		raw, err := os.ReadFile(filePath)
		if err != nil {
			log.Printf("warning: failed to read %s: %v", filePath, err)
			continue
		}

		var course map[string]interface{}
		if err := json.Unmarshal(raw, &course); err != nil {
			log.Printf("warning: failed to parse %s: %v", filePath, err)
			continue
		}

		id, ok := course["id"].(string)
		if !ok {
			log.Printf("warning: %s has no string 'id' field, skipping", filePath)
			continue
		}

		courseByID[id] = course
		log.Printf("loaded course: %s from %s", id, name)
	}

	reviewDir := filepath.Join(dataDir, "review")
	quizDir := filepath.Join(dataDir, "quiz")

	// Load discover content (returned by /beta/v1/discover).
	discoverPath := filepath.Join(dataDir, "discover", "discover.json")
	discoverRaw, err := os.ReadFile(discoverPath)
	if err != nil {
		log.Fatalf("failed to read %s: %v", discoverPath, err)
	}
	var discoverCheck []interface{}
	if err := json.Unmarshal(discoverRaw, &discoverCheck); err != nil {
		log.Fatalf("failed to parse %s: %v", discoverPath, err)
	}
	discoverJSON := discoverRaw
	log.Printf("loaded %d discover items", len(discoverCheck))

	// Load quiz data from data/quiz/*.json files.
	type quizSummary struct {
		ID            string `json:"id"`
		Title         string `json:"title"`
		Color         string `json:"color"`
		Icon          string `json:"icon"`
		QuestionCount int    `json:"questionCount"`
	}

	quizSummaries := make([]quizSummary, 0)
	quizQuestions := make(map[string][]interface{}) // quizId -> questions

	quizEntries, err := os.ReadDir(quizDir)
	if err != nil {
		log.Printf("warning: could not read quiz directory %s: %v", quizDir, err)
		quizEntries = nil
	}
	for _, entry := range quizEntries {
		name := entry.Name()
		if entry.IsDir() || !strings.HasSuffix(name, ".json") {
			continue
		}
		raw, err := os.ReadFile(filepath.Join(quizDir, name))
		if err != nil {
			log.Printf("warning: failed to read quiz file %s: %v", name, err)
			continue
		}
		var quiz map[string]interface{}
		if err := json.Unmarshal(raw, &quiz); err != nil {
			log.Printf("warning: failed to parse quiz file %s: %v", name, err)
			continue
		}
		id, _ := quiz["id"].(string)
		title, _ := quiz["title"].(string)
		color, _ := quiz["color"].(string)
		icon, _ := quiz["icon"].(string)
		questions, _ := quiz["questions"].([]interface{})
		if id == "" || len(questions) == 0 {
			continue
		}
		quizSummaries = append(quizSummaries, quizSummary{
			ID:            id,
			Title:         title,
			Color:         color,
			Icon:          icon,
			QuestionCount: len(questions),
		})
		quizQuestions[id] = questions
		log.Printf("loaded quiz: %s (%d questions) from %s", id, len(questions), name)
	}

	quizListJSON, err := json.Marshal(quizSummaries)
	if err != nil {
		log.Fatalf("failed to marshal quiz summaries: %v", err)
	}
	log.Printf("loaded %d quizzes", len(quizSummaries))

	http.HandleFunc("/beta/v1/quiz", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(quizListJSON)
	})

	http.HandleFunc("/beta/v1/quiz/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		quizID := strings.TrimPrefix(r.URL.Path, "/beta/v1/quiz/")
		questions, ok := quizQuestions[quizID]
		if !ok {
			http.NotFound(w, r)
			return
		}

		// Group questions by category. Questions with no category get category 0.
		byCategory := make(map[int][]interface{})
		for _, q := range questions {
			qmap, _ := q.(map[string]interface{})
			cat := 0
			if qmap != nil {
				if cv, ok := qmap["category"].(float64); ok {
					cat = int(cv)
				}
			}
			byCategory[cat] = append(byCategory[cat], q)
		}

		// Collect and sort category keys for deterministic cycling order.
		cats := make([]int, 0, len(byCategory))
		for c := range byCategory {
			cats = append(cats, c)
		}
		// Sort categories numerically.
		for i := 0; i < len(cats); i++ {
			for j := i + 1; j < len(cats); j++ {
				if cats[j] < cats[i] {
					cats[i], cats[j] = cats[j], cats[i]
				}
			}
		}

		// Shuffle questions within each category.
		for c := range byCategory {
			s := byCategory[c]
			rand.Shuffle(len(s), func(i, j int) { s[i], s[j] = s[j], s[i] })
		}

		// Cycle through categories, picking one question per category, no duplicates.
		// Track per-category index to avoid re-picking.
		catIndex := make(map[int]int)
		selected := make([]interface{}, 0, 10)
		for len(selected) < 10 {
			progress := false
			for _, c := range cats {
				if len(selected) >= 10 {
					break
				}
				idx := catIndex[c]
				if idx < len(byCategory[c]) {
					selected = append(selected, byCategory[c][idx])
					catIndex[c] = idx + 1
					progress = true
				}
			}
			if !progress {
				// All categories exhausted before reaching 10.
				break
			}
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"id":        quizID,
			"questions": selected,
		})
	})

	http.HandleFunc("/beta/v1/review", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Read all JSON files in the review directory on each request.
		entries, err := os.ReadDir(reviewDir)
		if err != nil {
			http.Error(w, "failed to read review dir", http.StatusInternalServerError)
			return
		}

		// Collect all card groups across all files.
		type cardGroup map[string]interface{}
		var groups []cardGroup
		for _, entry := range entries {
			if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".json") {
				continue
			}
			raw, err := os.ReadFile(filepath.Join(reviewDir, entry.Name()))
			if err != nil {
				continue
			}
			var cards []cardGroup
			if err := json.Unmarshal(raw, &cards); err != nil {
				continue
			}
			groups = append(groups, cards...)
		}

		// Shuffle groups and pick up to 12, then resolve one question per group.
		rand.Shuffle(len(groups), func(i, j int) { groups[i], groups[j] = groups[j], groups[i] })
		if len(groups) > 12 {
			groups = groups[:12]
		}

		result := make([]map[string]interface{}, 0, len(groups))
		for _, g := range groups {
			card := make(map[string]interface{})
			for k, v := range g {
				card[k] = v
			}
			// Pick one random question from the questions slice and promote it.
			if qs, ok := g["questions"].([]interface{}); ok && len(qs) > 0 {
				card["question"] = qs[rand.Intn(len(qs))]
				delete(card, "questions")
			}
			result = append(result, card)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(result)
	})

	http.HandleFunc("/beta/v1/discover", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(discoverJSON)
	})

	// Serve static files for discover images.
	discoverImagesDir := filepath.Join(dataDir, "discover", "images")
	http.Handle("/beta/v1/static/discover/", http.StripPrefix("/beta/v1/static/discover/", http.FileServer(http.Dir(discoverImagesDir))))

	http.HandleFunc("/beta/v1/courses", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(coursesJSON)
	})

	http.HandleFunc("/beta/v1/courses/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		path := strings.TrimPrefix(r.URL.Path, "/beta/v1/courses/")
		parts := strings.Split(path, "/")

		// GET /beta/v1/courses/{courseId}/sections
		if len(parts) == 2 && parts[1] == "sections" {
			courseID := parts[0]
			course, ok := courseByID[courseID]
			if !ok {
				http.NotFound(w, r)
				return
			}

			rawSections, _ := course["sections"].([]interface{})
			var summaries []map[string]interface{}
			for _, s := range rawSections {
				sec, ok := s.(map[string]interface{})
				if !ok {
					continue
				}
				summary := make(map[string]interface{})
				for k, v := range sec {
					if k != "pages" && k != "slides" && k != "quiz" && k != "spanningImages" {
						summary[k] = v
					}
				}
				summaries = append(summaries, summary)
			}

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(summaries)
			return
		}

		// GET /beta/v1/courses/{courseId}/sections/{sectionId}/pages
		if len(parts) == 4 && parts[1] == "sections" && parts[3] == "pages" {
			courseID := parts[0]
			sectionID := parts[2]

			course, ok := courseByID[courseID]
			if !ok {
				http.NotFound(w, r)
				return
			}

			rawSections, _ := course["sections"].([]interface{})
			for _, s := range rawSections {
				sec, ok := s.(map[string]interface{})
				if !ok {
					continue
				}
				if sec["id"] == sectionID {
					w.Header().Set("Content-Type", "application/json")
					json.NewEncoder(w).Encode(sec)
					return
				}
			}

			http.NotFound(w, r)
			return
		}

		http.NotFound(w, r)
	})

	log.Printf("loaded %d courses", len(courseByID))
	log.Println("server listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
