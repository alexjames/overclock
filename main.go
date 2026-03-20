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

// selectEvenlyAcrossSections picks `total` items distributed evenly across
// sections. Within each section, items are grouped by their numeric `category`
// field and cycled through so variety is maintained. Items are shuffled within
// each category before selection.
func selectEvenlyAcrossSections(sections [][]interface{}, total int) []interface{} {
	n := len(sections)
	if n == 0 {
		return nil
	}

	// Allocate slots per section evenly; remainder goes to earlier sections.
	slots := make([]int, n)
	base := total / n
	rem := total % n
	for i := range slots {
		slots[i] = base
		if i < rem {
			slots[i]++
		}
	}

	selected := make([]interface{}, 0, total)
	for si, sec := range sections {
		// Group by category within this section.
		byCategory := make(map[int][]interface{})
		for _, item := range sec {
			cat := 0
			if m, ok := item.(map[string]interface{}); ok {
				if cv, ok := m["category"].(float64); ok {
					cat = int(cv)
				}
			}
			byCategory[cat] = append(byCategory[cat], item)
		}
		// Sort category keys.
		cats := make([]int, 0, len(byCategory))
		for c := range byCategory {
			cats = append(cats, c)
		}
		for i := 0; i < len(cats); i++ {
			for j := i + 1; j < len(cats); j++ {
				if cats[j] < cats[i] {
					cats[i], cats[j] = cats[j], cats[i]
				}
			}
		}
		// Shuffle within each category.
		for c := range byCategory {
			s := byCategory[c]
			rand.Shuffle(len(s), func(i, j int) { s[i], s[j] = s[j], s[i] })
		}
		// Cycle through categories picking one at a time until quota filled.
		catIdx := make(map[int]int)
		quota := slots[si]
		picked := 0
		for picked < quota {
			progress := false
			for _, c := range cats {
				if picked >= quota {
					break
				}
				idx := catIdx[c]
				if idx < len(byCategory[c]) {
					selected = append(selected, byCategory[c][idx])
					catIdx[c] = idx + 1
					picked++
					progress = true
				}
			}
			if !progress {
				break
			}
		}
	}
	return selected
}

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

	// Load courses: flat JSON files and/or subdirectories of section files.
	courseByID := make(map[string]map[string]interface{})

	entries, err := os.ReadDir(coursesDir)
	if err != nil {
		log.Fatalf("failed to read courses directory %s: %v", coursesDir, err)
	}

	for _, entry := range entries {
		name := entry.Name()

		// Flat course file (legacy / single-file courses).
		if !entry.IsDir() {
			if !strings.HasSuffix(name, ".json") || name == "courses_index.json" {
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
			continue
		}

		// Subdirectory — section files ordered by sections.json if present,
		// otherwise alphabetically.
		courseID := name
		sectionDir := filepath.Join(coursesDir, courseID)

		// Determine ordered list of section entries from sections.json if present,
		// otherwise fall back to alphabetical order.
		type sectionEntry struct {
			File  string `json:"file"`
			ID    string `json:"id"`
			Title string `json:"title"`
		}
		var sectionEntryList []sectionEntry
		orderRaw, err := os.ReadFile(filepath.Join(sectionDir, "sections.json"))
		if err == nil {
			if err := json.Unmarshal(orderRaw, &sectionEntryList); err != nil {
				log.Printf("warning: failed to parse sections.json for %s: %v", courseID, err)
				sectionEntryList = nil
			}
		}
		if len(sectionEntryList) == 0 {
			dirEntries, err := os.ReadDir(sectionDir)
			if err != nil {
				log.Printf("warning: failed to read course dir %s: %v", sectionDir, err)
				continue
			}
			for _, se := range dirEntries {
				sname := se.Name()
				if !se.IsDir() && strings.HasSuffix(sname, ".json") && sname != "sections.json" {
					sectionEntryList = append(sectionEntryList, sectionEntry{File: sname})
				}
			}
		}

		var sections []interface{}
		for _, entry := range sectionEntryList {
			raw, err := os.ReadFile(filepath.Join(sectionDir, entry.File))
			if err != nil {
				log.Printf("warning: failed to read section %s: %v", entry.File, err)
				continue
			}
			var section map[string]interface{}
			if err := json.Unmarshal(raw, &section); err != nil {
				log.Printf("warning: failed to parse section %s: %v", entry.File, err)
				continue
			}
			// sections.json id/title take precedence over what's in the file.
			if entry.ID != "" {
				section["id"] = entry.ID
			}
			if entry.Title != "" {
				section["title"] = entry.Title
			}
			sections = append(sections, section)
			log.Printf("loaded section: %s/%s", courseID, entry.File)
		}

		// Build the course object from the index entry, merging in sections.
		course := map[string]interface{}{
			"id":       courseID,
			"sections": sections,
		}
		// Overlay any metadata from the index for this course.
		for _, idx := range indexCheck {
			if idx["id"] == courseID {
				for k, v := range idx {
					course[k] = v
				}
				break
			}
		}
		courseByID[courseID] = course
		log.Printf("loaded course: %s (%d sections) from directory", courseID, len(sections))
	}

	reviewDir := filepath.Join(dataDir, "review")
	quizDir := filepath.Join(dataDir, "quiz")

	// Load flashcard decks from data/review/*.json files.
	type deckSummary struct {
		ID    string `json:"id"`
		Title string `json:"title"`
		Color string `json:"color"`
		Icon  string `json:"icon"`
		Count int    `json:"count"`
	}

	deckSummaries := make([]deckSummary, 0)
	deckCards := make(map[string][]interface{})    // deckId -> all cards
	deckSections := make(map[string][][]interface{}) // deckId -> per-section card slices

	reviewEntries, err := os.ReadDir(reviewDir)
	if err != nil {
		log.Printf("warning: could not read review directory %s: %v", reviewDir, err)
		reviewEntries = nil
	}
	for _, entry := range reviewEntries {
		name := entry.Name()

		if entry.IsDir() {
			// Subdirectory: merge all section files into one deck, tracking per-section slices.
			deckID := name
			subDir := filepath.Join(reviewDir, name)
			subEntries, err := os.ReadDir(subDir)
			if err != nil {
				log.Printf("warning: failed to read review subdir %s: %v", subDir, err)
				continue
			}
			var allCards []interface{}
			var secSlices [][]interface{}
			var title, color, icon string
			for _, se := range subEntries {
				sname := se.Name()
				if se.IsDir() || !strings.HasSuffix(sname, ".json") {
					continue
				}
				raw, err := os.ReadFile(filepath.Join(subDir, sname))
				if err != nil {
					log.Printf("warning: failed to read review section %s/%s: %v", name, sname, err)
					continue
				}
				var sec map[string]interface{}
				if err := json.Unmarshal(raw, &sec); err != nil {
					log.Printf("warning: failed to parse review section %s/%s: %v", name, sname, err)
					continue
				}
				if cards, ok := sec["cards"].([]interface{}); ok && len(cards) > 0 {
					allCards = append(allCards, cards...)
					secSlices = append(secSlices, cards)
				}
				if t, ok := sec["title"].(string); ok && title == "" {
					title = t
				}
				if c, ok := sec["color"].(string); ok && color == "" {
					color = c
				}
				if ic, ok := sec["icon"].(string); ok && icon == "" {
					icon = ic
				}
			}
			// Flat metadata file overrides.
			metaPath := filepath.Join(reviewDir, name+".json")
			if raw, err := os.ReadFile(metaPath); err == nil {
				var meta map[string]interface{}
				if json.Unmarshal(raw, &meta) == nil {
					if t, ok := meta["title"].(string); ok {
						title = t
					}
					if c, ok := meta["color"].(string); ok {
						color = c
					}
					if ic, ok := meta["icon"].(string); ok {
						icon = ic
					}
				}
			}
			if len(allCards) == 0 {
				continue
			}
			deckSummaries = append(deckSummaries, deckSummary{
				ID:    deckID,
				Title: title,
				Color: color,
				Icon:  icon,
				Count: len(allCards),
			})
			deckCards[deckID] = allCards
			deckSections[deckID] = secSlices
			log.Printf("loaded flashcard deck: %s (%d cards, %d sections) from directory", deckID, len(allCards), len(secSlices))
			continue
		}

		if !strings.HasSuffix(name, ".json") {
			continue
		}
		raw, err := os.ReadFile(filepath.Join(reviewDir, name))
		if err != nil {
			log.Printf("warning: failed to read review file %s: %v", name, err)
			continue
		}
		var deck map[string]interface{}
		if err := json.Unmarshal(raw, &deck); err != nil {
			log.Printf("warning: failed to parse review file %s: %v", name, err)
			continue
		}
		id, _ := deck["id"].(string)
		title, _ := deck["title"].(string)
		color, _ := deck["color"].(string)
		icon, _ := deck["icon"].(string)
		cards, _ := deck["cards"].([]interface{})
		if id == "" || len(cards) == 0 {
			continue
		}
		deckSummaries = append(deckSummaries, deckSummary{
			ID:    id,
			Title: title,
			Color: color,
			Icon:  icon,
			Count: len(cards),
		})
		deckCards[id] = cards
		log.Printf("loaded flashcard deck: %s (%d cards) from %s", id, len(cards), name)
	}

	deckListJSON, err := json.Marshal(deckSummaries)
	if err != nil {
		log.Fatalf("failed to marshal deck summaries: %v", err)
	}
	log.Printf("loaded %d flashcard decks", len(deckSummaries))

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
	quizQuestions := make(map[string][]interface{})    // quizId -> all questions
	quizSections := make(map[string][][]interface{})   // quizId -> per-section question slices

	quizEntries, err := os.ReadDir(quizDir)
	if err != nil {
		log.Printf("warning: could not read quiz directory %s: %v", quizDir, err)
		quizEntries = nil
	}
	for _, entry := range quizEntries {
		name := entry.Name()

		if entry.IsDir() {
			// Subdirectory: merge all section files into one quiz, tracking per-section slices.
			quizID := name
			subDir := filepath.Join(quizDir, name)
			subEntries, err := os.ReadDir(subDir)
			if err != nil {
				log.Printf("warning: failed to read quiz subdir %s: %v", subDir, err)
				continue
			}
			var allQuestions []interface{}
			var secSlices [][]interface{}
			var title, color, icon string
			for _, se := range subEntries {
				sname := se.Name()
				if se.IsDir() || !strings.HasSuffix(sname, ".json") {
					continue
				}
				raw, err := os.ReadFile(filepath.Join(subDir, sname))
				if err != nil {
					log.Printf("warning: failed to read quiz section %s/%s: %v", name, sname, err)
					continue
				}
				var sec map[string]interface{}
				if err := json.Unmarshal(raw, &sec); err != nil {
					log.Printf("warning: failed to parse quiz section %s/%s: %v", name, sname, err)
					continue
				}
				if qs, ok := sec["questions"].([]interface{}); ok && len(qs) > 0 {
					allQuestions = append(allQuestions, qs...)
					secSlices = append(secSlices, qs)
				}
				if t, ok := sec["title"].(string); ok && title == "" {
					title = t
				}
				if c, ok := sec["color"].(string); ok && color == "" {
					color = c
				}
				if ic, ok := sec["icon"].(string); ok && icon == "" {
					icon = ic
				}
			}
			// Flat metadata file overrides.
			metaPath := filepath.Join(quizDir, name+".json")
			if raw, err := os.ReadFile(metaPath); err == nil {
				var meta map[string]interface{}
				if json.Unmarshal(raw, &meta) == nil {
					if t, ok := meta["title"].(string); ok {
						title = t
					}
					if c, ok := meta["color"].(string); ok {
						color = c
					}
					if ic, ok := meta["icon"].(string); ok {
						icon = ic
					}
				}
			}
			if len(allQuestions) == 0 {
				continue
			}
			quizSummaries = append(quizSummaries, quizSummary{
				ID:            quizID,
				Title:         title,
				Color:         color,
				Icon:          icon,
				QuestionCount: len(allQuestions),
			})
			quizQuestions[quizID] = allQuestions
			quizSections[quizID] = secSlices
			log.Printf("loaded quiz: %s (%d questions, %d sections) from directory", quizID, len(allQuestions), len(secSlices))
			continue
		}

		if !strings.HasSuffix(name, ".json") {
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

		// Use per-section slices if available (directory-based quiz), otherwise
		// treat all questions as a single section.
		sections := quizSections[quizID]
		if len(sections) == 0 {
			sections = [][]interface{}{questions}
		}

		selected := selectEvenlyAcrossSections(sections, 10)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"id":        quizID,
			"questions": selected,
		})
	})

	// GET /beta/v1/review — list all flashcard decks
	http.HandleFunc("/beta/v1/review", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(deckListJSON)
	})

	// GET /beta/v1/review/{deckId} — get 10 category-distributed cards for a deck
	http.HandleFunc("/beta/v1/review/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		deckID := strings.TrimPrefix(r.URL.Path, "/beta/v1/review/")
		cards, ok := deckCards[deckID]
		if !ok {
			http.NotFound(w, r)
			return
		}

		// Use per-section slices if available (directory-based deck), otherwise
		// treat all cards as a single section.
		sections := deckSections[deckID]
		if len(sections) == 0 {
			sections = [][]interface{}{cards}
		}

		selected := selectEvenlyAcrossSections(sections, 10)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"id":    deckID,
			"cards": selected,
		})
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
			if _, ok := courseByID[courseID]; !ok {
				http.NotFound(w, r)
				return
			}

			// For directory-based courses, read sections.json directly so the
			// response always reflects the authoritative order and metadata.
			type sectionEntry struct {
				File  string `json:"file"`
				ID    string `json:"id"`
				Title string `json:"title"`
				Group string `json:"group"`
			}
			sectionDir := filepath.Join(coursesDir, courseID)
			orderRaw, err := os.ReadFile(filepath.Join(sectionDir, "sections.json"))
			if err == nil {
				var entries []sectionEntry
				if json.Unmarshal(orderRaw, &entries) == nil {
					summaries := make([]map[string]interface{}, 0, len(entries))
					for _, e := range entries {
						summary := map[string]interface{}{
							"id":    e.ID,
							"title": e.Title,
						}
						// Merge any non-content fields from the section file itself.
						raw, err := os.ReadFile(filepath.Join(sectionDir, e.File))
						if err == nil {
							var sec map[string]interface{}
							if json.Unmarshal(raw, &sec) == nil {
								for k, v := range sec {
									if k != "pages" && k != "slides" && k != "quiz" && k != "spanningImages" {
										summary[k] = v
									}
								}
							}
						}
						// sections.json id/title/group always win.
						summary["id"] = e.ID
						summary["title"] = e.Title
						if e.Group != "" {
							summary["group"] = e.Group
						}
						summaries = append(summaries, summary)
					}
					w.Header().Set("Content-Type", "application/json")
					json.NewEncoder(w).Encode(summaries)
					return
				}
			}

			// Fallback: use in-memory sections (flat course files).
			course := courseByID[courseID]
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
