function analyzeStory() {
  
    const input = document.getElementById('storyInput').value;
    const doc = nlp(input);
    const tokens = doc.terms().out('array');
    const unique = [...new Set(tokens)];

    const ttr = (unique.length / tokens.length).toFixed(2);
  
    document.getElementById("totalWordsDisplay").textContent = tokens.length;
    document.getElementById("uniqueWordsDisplay").textContent = unique.length;
    document.getElementById("ttrDisplay").textContent = isFinite(ttr) ? ttr : "0.00";

  
    const morphemes = analyzeMorpheme(input); // ✅ new line here

    const { clauseCount, subordinateClauseCount } = detectClauses(input); 

    // Total clauses = main + subordinate
    const totalClauses = clauseCount + subordinateClauseCount;

    console.log("Main:", clauseCount);
console.log("Subordinate:", subordinateClauseCount);
console.log("Total Clauses:", totalClauses);

    // Compute the Subordination Index
    const subordinationIndex =
    totalClauses > 0 ? subordinateClauseCount / totalClauses : 0;

    // Display the index
    document.getElementById("subordinationIndexDisplay").textContent =
     subordinationIndex.toFixed(2);


     const cohesionIndex = detectCohesion(input);
     document.getElementById("cohesionDisplay").textContent = cohesionIndex;

     const verbErrors = detectVerbErrors(input);

     const verbErrorPerClause = verbErrors > 0 ? verbErrors / totalClauses : 0;
     document.getElementById("verbErrorPerClauseDisplay").textContent =
     verbErrorPerClause.toFixed(2);

     const wordChoiceErrors = detectWordChoiceErrors(input);

     const wordChoiceErrorsRatio = wordChoiceErrors > 0 ? wordChoiceErrors / tokens.length : 0;
     document.getElementById("wordChoiceErrorsRatioDisplay").textContent =
     wordChoiceErrorsRatio.toFixed(2);
      
    /*const verbErrors = detectVerbErrors(input);

    const verbErrorLog = document.getElementById("verbErrorLog");
    verbErrorLog.innerHTML = ""; // Clear any previous content

    if (verbErrors.length === 0) {
        verbErrorLog.innerHTML = "<li>✅ No verb errors detected.</li>";
    } else {
    verbErrors.forEach(error => {
    const li = document.createElement("li");
    li.textContent = error;
    verbErrorLog.appendChild(li);
    });
    }*/
    

    const container = document.getElementById('results-container');
    container.classList.add("visible");
  
    const downloadBtn = document.getElementById('downloadBtn');
    downloadBtn.style.display = 'inline-block';
  
    drawTotalWordsChart(tokens.length);
    drawUniqueWordsChart(unique.length,tokens.length);
    drawTTRChart(ttr);
    drawMorphemeChart(morphemes, tokens.length);
    drawClauseChart(clauseCount, nlp(input).sentences().length, totalClauses);
    drawSubordinateClauseChart(subordinateClauseCount, clauseCount, totalClauses);
    drawSynaticSubordinateIndexChart(subordinationIndex);
    drawCohesionChart(cohesionIndex);
    drawVerbErrorsChart(verbErrors, tokens.length);
    drawVerbErrorsPerClauseChart(verbErrorPerClause);
    drawWordChoiceErrorsChart(wordChoiceErrors, tokens.length);
    drawWordChoiceErrorsRatioChart(wordChoiceErrorsRatio);
    // ✅ Call the combined chart last
    drawCombinedChart(tokens.length, unique.length, ttr, morphemes, clauseCount, subordinateClauseCount, subordinationIndex, cohesionIndex, verbErrors, verbErrorPerClause, wordChoiceErrors, wordChoiceErrorsRatio);
    document.getElementById("results-container").scrollIntoView({ behavior: "smooth" });
  }

  let charts = {};  // 🧠 Key part: A container for ALL your charts

  
  function handleOwlClick() {
    document.body.classList.toggle("light-theme");
    const owl = document.querySelector(".owl-icon");
    owl.classList.toggle("inverted");
  
    const isLight = document.body.classList.contains("light-theme");
    const emoji = isLight ? "Click to turn on 🌕🦉 mode" : "Click to turn on ☀️🦉 mode";
    document.getElementById("modeLabel").textContent = emoji;
  }
  
  function googleTranslateElementInit() {
    new google.translate.TranslateElement({
      pageLanguage: 'en',
      includedLanguages: 'en,es,fr,de,zh,ar,hi,ru,sw,pt,it,ja,ko,tr,vi',
      layout: google.translate.TranslateElement.InlineLayout.SIMPLE
    }, 'google_translate_element');
  }
  
  // Initialize immediately when page loads
  window.addEventListener('DOMContentLoaded', googleTranslateElementInit);
  
  
  function triggerFileInput() {
    document.getElementById("fileInput").click();
  }

  function downloadPDF() {
    const element = document.body; // Export the entire page
  
    const opt = {
      margin: 0,
      filename: 'full-page-analysis.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        scrollY: 0
      },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css'] }
    };
  
    html2pdf().set(opt).from(element).save();
  }
  
  
  
  function handleFileUpload() {
    const fileInput = document.getElementById("fileInput");
    const file = fileInput.files[0];
    const storyInput = document.getElementById("storyInput");
  
    if (!file) {
      alert("No file selected.");
      return;
    }
  
    const fileName = file.name.toLowerCase();
    const reader = new FileReader();
  
    if (fileName.endsWith(".txt")) {
      reader.onload = function (e) {
        storyInput.value = e.target.result;
      };
      reader.readAsText(file);
  
    } else if (fileName.endsWith(".docx")) {
      reader.onload = function (e) {
        const arrayBuffer = e.target.result;
  
        if (typeof mammoth !== 'undefined') {
          mammoth.extractRawText({ arrayBuffer: arrayBuffer })
            .then(function (result) {
              storyInput.value = result.value;
            })
            .catch(function (err) {
              alert("Error reading .docx file. Please try another file.");
              console.error("Mammoth.js error:", err);
            });
        } else {
          alert("Mammoth.js library is missing. Please ensure it's loaded.");
        }
      };
      reader.readAsArrayBuffer(file);
  
    } else {
      alert("Unsupported file format.\n\nPlease upload a .txt or .docx file only.");
      fileInput.value = ""; // Clear the invalid file input
    }
  }
  
  
  
  function drawTotalWordsChart(total) {
    
    const axisColor = '#D27D2D'; // Lakers Purple
    const suggestedMax = Math.ceil((total + 10) / 10) * 10;
  
    const ctx = document.getElementById('wordChart').getContext('2d');

  // 🧹 Destroy old chart safely
  if (charts.wordChart) {
    charts.wordChart.destroy();
  }

  // 🎯 Create and save the new chart
  charts.wordChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Your Story'],
        datasets: [{
          label: 'Total Words',
          data: [total],
          borderColor: '#FFD700',
          backgroundColor: 'rgb(107, 63, 148, 0.6)',
          tension: 0.3,
          fill: true,
          pointRadius: 5,
          borderWidth: 2,
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            max: total,
            ticks: { 
                stepSize: Math.ceil(total / 5),
                color: axisColor },
            grid: { color: axisColor }
          },
          x: {
            ticks: { color: axisColor },
            grid: { color: axisColor }
          }
        },
        plugins: {
          legend: {
            labels: { color: axisColor }
          }
        }
      }
    });
  }
  
  function drawUniqueWordsChart(unique, totalWords) {
    const axisColor = '#D27D2D'; // Lakers Purple

    const ctx = document.getElementById('uniqueChart').getContext('2d');

  // 🧹 Destroy old chart safely
  if (charts.uniqueChart) {
    charts.uniqueChart.destroy();
  }

  // 🎯 Create and save the new chart
  charts.uniqueChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Your Story'],
        datasets: [{
          label: 'Unique Words',
          data: [unique],
          borderColor: '#FFD700',
          backgroundColor: 'rgb(107, 63, 148, 0.6)',
          tension: 0.3,
          fill: true,
          pointRadius: 5,
          borderWidth: 2,
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            max: totalWords,
            ticks: {
              stepSize: Math.ceil(totalWords / 5),
              color: axisColor
            },
            grid: { color: axisColor }
          },
          x: {
            ticks: { color: axisColor },
            grid: { color: axisColor }
          }
        },
        plugins: {
          legend: {
            labels: { color: axisColor }
          }
        }
      }
    });
  }
  
  function drawTTRChart(ttr) {
    const axisColor = '#D27D2D'; // Lakers Purple
  
    const ctx = document.getElementById('ttrChart').getContext('2d');

  // 🧹 Destroy old chart safely
  if (charts.ttrChart) {
    charts.ttrChart.destroy();
  }

  // 🎯 Create and save the new chart
  charts.ttrChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Your Story'],
        datasets: [{
          label: 'Type-Token Ratio (0–1 Scale)',
          data: [parseFloat(ttr)],
          borderColor: '#FFD700',
          backgroundColor: 'rgb(107, 63, 148, 0.6)',
          tension: 0.3,
          fill: true,
          pointRadius: 5,
          borderWidth: 2,
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            max: 1,
            ticks: {
              stepSize: 0.1,
              color: axisColor
            },
            grid: { color: axisColor }
          },
          x: {
            ticks: { color: axisColor },
            grid: { color: axisColor }
          }
        },
        plugins: {
          legend: {
            labels: { color: axisColor }
          }
        }
      }
    });
  }
  

  const observer = new MutationObserver(() => {
    const banner = document.querySelector('.goog-te-banner-frame');
    if (banner) {
      document.body.classList.add('translate-active');
    } else {
      document.body.classList.remove('translate-active');
    }
  });
  
  observer.observe(document.body, { childList: true, subtree: true });

//NEW
const storyInput = document.getElementById('storyInput');

// Highlight when dragging over
storyInput.addEventListener('dragover', (e) => {
  e.preventDefault();
  storyInput.style.borderColor = '#552583';
  storyInput.style.backgroundColor = '#1a1a1a';
});

// Reset style when leaving drop zone
storyInput.addEventListener('dragleave', () => {
  storyInput.style.borderColor = '#FFD700';
  storyInput.style.backgroundColor = '#111';
});

// Handle dropped file
storyInput.addEventListener('drop', (e) => {
  e.preventDefault();
  storyInput.style.borderColor = '#FFD700';
  storyInput.style.backgroundColor = '#111';

  const file = e.dataTransfer.files[0];
  if (!file) return;

  const isValid = file.name.endsWith('.txt') || file.name.endsWith('.docx');
  if (!isValid) {
    alert('Only .txt and .docx files are supported.');
    return;
  }

  const reader = new FileReader();

  if (file.name.endsWith('.txt')) {
    reader.onload = (event) => {
      storyInput.value = event.target.result;
    };
    reader.readAsText(file);
  } else if (file.name.endsWith('.docx')) {
    reader.onload = (event) => {
      const arrayBuffer = event.target.result;
      mammoth.extractRawText({ arrayBuffer }).then((result) => {
        storyInput.value = result.value;
      }).catch((err) => {
        alert("Error reading .docx file");
        console.error(err);
      });
    };
    reader.readAsArrayBuffer(file);
  }
});

let recognition;
let micOn = false;

function toggleMic() {
  const micBtn = document.querySelector('.mic-btn');
  const storyInput = document.getElementById('storyInput');

  // If browser doesn't support speech recognition
  if (!('webkitSpeechRecognition' in window)) {
    alert("Your browser doesn't support speech recognition.");
    return;
  }

  if (!recognition) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      storyInput.value = storyInput.value + transcript;
    };

    recognition.onerror = (event) => {
      console.error("Speech Recognition Error: ", event.error);
      micBtn.textContent = "🎙️ Mic Off";
      micOn = false;
    };

    recognition.onend = () => {
      if (micOn) {
        recognition.start(); // Auto-restart if ended unexpectedly
      }
    };
  }

  if (!micOn) {
    recognition.start();
    micOn = true;
    micBtn.textContent = "🎙️ Mic On";
  } else {
    recognition.stop();
    micOn = false;
    micBtn.textContent = "🎙️ Mic Off";
  }
}

function analyzeMorpheme(text) {
    const words = text.split(/\s+/);
    let morphemeCount = 0;
  
    for (let word of words) {
      word = word.toLowerCase().replace(/[^\w]/g, ''); // remove punctuation
      if (!word) continue;
  
      if (doNotSplit.includes(word)) {
        morphemeCount += 1;
        continue;
      }
  
      const morphemes = splitMorphemes(word);
      morphemeCount += morphemes.length;
    }
  
    document.getElementById("morphemeDisplay").textContent = morphemeCount;
  
    // ✅ Now draw the morpheme chart
    return morphemeCount;

  }
  
  function splitMorphemes(word) {
    const suffixes = ["ing", "ed", "s", "es", "ly", "ness", "ment", "ful", "less", "able", "er", "est", "ish", "y"];
    const prefixes = ["un", "re", "dis", "mis", "pre", "non", "in", "im", "over", "under"];
  
    const prefixesFound = [];
    const suffixesFound = [];
  
    let remaining = word;
  
    // ✅ Recursively extract all prefixes
    let foundPrefix = true;
    while (foundPrefix) {
      foundPrefix = false;
      for (let pre of prefixes) {
        if (remaining.startsWith(pre) && remaining.length > pre.length + 2) {
          prefixesFound.push(pre);
          remaining = remaining.slice(pre.length);
          foundPrefix = true;
          break;
        }
      }
    }
  
    // ✅ Recursively extract all suffixes
    let foundSuffix = true;
    while (foundSuffix) {
      foundSuffix = false;
      for (let suf of suffixes) {
        if (remaining.endsWith(suf) && remaining.length > suf.length + 1) {
          suffixesFound.unshift("-" + suf);
          remaining = remaining.slice(0, remaining.length - suf.length);
          foundSuffix = true;
          break;
        }
      }
    }
  
    // ✅ Combine in correct order
    const morphemes = [...prefixesFound, remaining, ...suffixesFound];
  
    // ✅ Optional cap (prevent 10-morpheme skibidi inflation)
    if (morphemes.length > 6) return [word];
  
    return morphemes;
  }
  
  
  const doNotSplit = [
    "bruh", "rizz", "frfr", "bussin", "gyat", "lit", "mid", "yeet", "npc",
    "drip", "sus", "tbh", "cheugy", "vibe", "goat", "cap", "finna", "gonna",
    "wanna", "onfleek", "delulu", "mewing", "glazed", "skibidi"
  ];
  
  function drawMorphemeChart(totalMorphemes, totalWords) {
    const axisColor = '#D27D2D';
    const estimatedMax = Math.ceil(totalWords * 3);

    const ctx = document.getElementById('morphemeChart').getContext('2d');

  // 🧹 Destroy old chart safely
  if (charts.morphemeChart) {
    charts.morphemeChart.destroy();
  }

  // 🎯 Create and save the new chart
  charts.morphemeChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Your Story'],
        datasets: [{
          label: 'Total Morphemes',
          data: [totalMorphemes],
          borderColor: '#FFD700',
          backgroundColor: 'rgb(107, 63, 148, 0.6)',
          tension: 0.3,
          fill: true,
          pointRadius: 5,
          borderWidth: 2,
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            max: (totalMorphemes * 2), // ✅ Adjusted here
            ticks: {
              stepSize: Math.ceil(totalMorphemes / 5),
              color: axisColor
            },
            grid: { color: axisColor }
          },
          x: {
            ticks: { color: axisColor },
            grid: { color: axisColor }
          }
        },
        plugins: {
          legend: {
            labels: { color: axisColor }
          }
        }
      }
    });
  }

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
  

function drawCombinedChart(totalWords, uniqueWords, ttr, morphemes, clauseCount, subordinateClauseCount, subordinationIndex, cohesionIndex, verbErrors, verbErrorPerClause, wordChoiceErrors, wordChoiceErrorsRatio) {
    //const ctx = document.getElementById('combinedChart').getContext('2d');
    
    const axisColor = '#D27D2D'; // Lakers Purple

    const ctx = document.getElementById('combinedChart').getContext('2d');

  // 🧹 Destroy old chart safely
  if (charts.combinedChart) {
    charts.combinedChart.destroy();
  }

  // 🎯 Create and save the new chart
  charts.combinedChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Total Words','Unique Words','TTR %', 'Morphemes', 'Main Clauses', 'Subordinate Clauses', 'Subordination Index %', 'Cohesion %', 'Verb Errors', 'Verb Errors Per Sentence Ratio %','Word Choice Errors','Word Choice Frequency %'],
        color: '#FFFFFF',
        datasets: [{
          label: 'Total Statistics Overview',
          data: [
            totalWords,
            uniqueWords,
            parseFloat(ttr * 100).toFixed(2), // Show TTR as %
            morphemes,
            clauseCount,
            subordinateClauseCount,
            parseFloat(subordinationIndex * 100).toFixed(2),
            parseFloat(cohesionIndex * 100).toFixed(2),
            verbErrors,
            parseFloat(verbErrorPerClause * 100).toFixed(2),
            wordChoiceErrors,
            parseFloat(wordChoiceErrorsRatio * 100).toFixed(2)
          ],
          color: '#FFFFFF',
          borderColor: '#FFD700',
          backgroundColor: 'rgb(107, 63, 148, 0.6)',
          tension: 0.3,
          fill: true,
          pointRadius: 5,
          borderWidth: 2
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            max : 1000,
            ticks: {
                color: axisColor // ✅ White Y-axis labels
              },
            color: axisColor,
            beginAtZero: true,
            grid: {
                color: axisColor // ✅ Gray Y-axis grid lines
              },
            title: {
              display: true,
              text: 'Count / Percentage'
            }
          },
        x: {
            ticks: {
                color: axisColor // ✅ White X-axis labels
              },
              grid: {
                color: axisColor // ✅ Gray X-axis grid lines
              }
          }
        },
        plugins: {
          legend: {
            labels: {
              color: axisColor
            }
          }
        }
      }
    });
  }

  function getFullPOSTag(tag) {
    const map = {
      cc: "Coordinating Conjunction",
    cd: "Cardinal Number",
    dt: "Determiner",
    ex: "Existential 'There'",
    fw: "Foreign Word",
    in: "Preposition or Subordinating Conjunction",
    jj: "Adjective",
    jjr: "Adjective (Comparative)",
    jjs: "Adjective (Superlative)",
    ls: "List Item Marker",
    md: "Modal",
    nn: "Noun (Singular or Mass)",
    nns: "Noun (Plural)",
    nnp: "Proper Noun (Singular)",
    nnps: "Proper Noun (Plural)",
    pdt: "Predeterminer",
    pos: "Possessive Ending",
    prp: "Personal Pronoun",
    prp$: "Possessive Pronoun",
    rb: "Adverb",
    rbr: "Adverb (Comparative)",
    rbs: "Adverb (Superlative)",
    rp: "Particle",
    sym: "Symbol",
    to: "To (Infinitive Marker)",
    uh: "Interjection",
    vb: "Verb (Base Form)",
    vbd: "Verb (Past Tense)",
    vbg: "Verb (Gerund / Present Participle)",
    vbn: "Verb (Past Participle)",
    vbp: "Verb (Non-3rd Person Singular Present)",
    vbz: "Verb (3rd Person Singular Present)",
    wdt: "Wh-Determiner",
    wp: "Wh-Pronoun",
    wp$: "Possessive Wh-Pronoun",
    wrb: "Wh-Adverb"
    };
    return map[tag] || tag;
  }
  
  function togglePOS(id, btn) {
    const el = document.getElementById(id);
    const arrow = btn.querySelector("span");
    const isVisible = el.style.display === "block";
  
    el.style.display = isVisible ? "none" : "block";
    arrow.textContent = isVisible ? "⬇️" : "▲";
  }

  
  
  function detectClauses(text) {
    const sentences = RiTa.sentences(text);
    let clauseCount = 0;
    let subordinateClauseCount = 0;
    let logHTML = `
  <h4 style="color:#FFD700;">🧠 Sentence-by-Sentence Story breakdown</h4>
  <p style="color:#87CEEB;"><strong>🔹 Part Of Speech Color Guide</strong></p>
  <ul style="color:#ccc; line-height:1.4;">
    <span style="color:#00FF7F;">🟩 <strong>Subjects</strong></span><br><br>
      

    <span style="color:#FF6347;">🟥 <strong>Verbs</strong></span><br><br>
      

    <span style="color:#FFD700;">🟨 <strong>Modifiers/Others</strong></span><br><br>
      
  </ul>
`;

    logHTML += `
  <p style="color:#D27D2D; font-weight: bold; font-size: 1.1rem; margin-top: 1.5rem; margin-bottom: 0.5rem;">
    ⚡ Click on any sentence to see the structure of it, which includes the Part of Speech of each word and the number of Main and Dependent Clauses detected by Hoo 🦉
  </p>
`;
  
    for (const sentence of sentences) {
      const sentenceId = `sentence-${Math.random().toString(36).substr(2, 9)}`;
      logHTML += `
        <div style="margin-bottom:1.5em;">
          <button class="pos-toggle-btn" onclick="togglePOS('${sentenceId}', this)">
            🔍 "${sentence.trim()}" <span>⬇️</span>
          </button>
          <div id="${sentenceId}" style="display:none; margin-left:1em;">
      `;
  
      const words = RiTa.tokenize(sentence);
      const tags = RiTa.pos(sentence);
  
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const tag = tags[i];
        let color = "#ccc";

        if (["ex", "nn", "nnp", "nns", "prp", "prp$"].includes(tag)) {
          color = "#00FF7F"; // Nouns / Pronouns
        } else if (["vb", "vbd", "vbg", "vbn", "vbz", "vbp", "md"].includes(tag)) {
          color = "#FF6347"; // Verbs / Modals
        } else if (["jj", "jjr", "jjs", "rb", "rbr", "rbs", "dt", "in", "cc", "to", "cd"].includes(tag)) {
          color = "#FFD700"; // Adjectives, Adverbs, Conjunctions, Determiners, Numbers
        }
  
        logHTML += `<span style="color:${color}; font-weight:bold;">${word}</span> 
                    <span style="color:#D27D2D;">(${getFullPOSTag(tag)})</span><br>`;
      }
  
      const containsComma = sentence.includes(',');
  
      if (containsComma) {
        const resultB = detectClausesFuncC(sentence);
        clauseCount += resultB.clauseCount;
        subordinateClauseCount += resultB.subordinateClauseCount;
      } else {
        const resultA = detectClausesFuncC(sentence);
        clauseCount += resultA.clauseCount;
        subordinateClauseCount += resultA.subordinateClauseCount;
      }
  
      logHTML += `
          <p style="color:#FFD700;"><strong>🎯 TOTAL MAIN CLAUSES DETECTED: ${clauseCount}</strong></p>
          <p style="color:#87CEEB;"><strong>🧩 TOTAL SUBORDINATE CLAUSES DETECTED: ${subordinateClauseCount}</strong></p>
          </div>
        </div>
      `;
    }
  
    document.getElementById("clauseDebugLog").innerHTML = logHTML;
    document.getElementById("clauseDisplay").textContent = clauseCount;
    document.getElementById("subordinateClauseDisplay").textContent = subordinateClauseCount;
  
    return {
      clauseCount,
      subordinateClauseCount
    };
  }

  function detectClausesFuncA(sentence) {
    let clauseCount = 0;
    let subordinateClauseCount = 0;
    let logHTML = `<h4 style="color:#FFD700;">🧠 Clause Detection Log:</h4>`;

    const subjectTags = ["prp", "nn", "nns", "nnp", "nnps"];
    const verbTags = ["vb", "vbd", "vbp", "vbz", "vbg", "vbn"];
    const modalTag = "md";
    const resetTriggers = [",", "but", "so", "or", "yet", "for", "nor", "and"];
    const subordinatingWords = [
        "after", "although", "as", "because", "before", "even though", "if",
        "since", "so that", "than", "that", "though", "unless", "until",
        "when", "whenever", "where", "whereas", "wherever", "whether", "while",
        "who", "whose", "whom", "which", "why"
    ];

    // Tokenize the sentence and use the passed POS tags
    const words = RiTa.tokenize(sentence);  // Tokenize the sentence into words
    const tags = RiTa.pos(sentence);        // Use the passed tags

    let hasSubject = false;
    let hasVerb = false;
    let sawModal = false;
    let lockClause = false;
    let subordinateMode = false;
    let subordinateClauseOpen = false;
    let lastSubject = null;
    let compoundLock = false;

    // Process each word and its corresponding tag in the sentence
    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const tag = tags[i];  // Use the POS tag directly from the passed `tags`
        const lowerWord = word.toLowerCase();

        logHTML += `<span style="display:block; margin-left:1rem;">Word: <strong>${word}</strong> → Tag: ${tag}</span>`;

        // Detect subordinate clause based on subordinating words
        if (!subordinateMode && subordinatingWords.includes(lowerWord)) {
            subordinateMode = true;
            subordinateClauseOpen = true;
            subordinateClauseCount++;
            logHTML += `<span style="color:#87CEEB; margin-left:2rem;">🧩 Subordinating Word Triggered: "${word}"</span>`;
            hasSubject = false;
            hasVerb = false;
            continue;
        }

        // If a comma ends the subordinate clause
        if (lowerWord === "," && subordinateClauseOpen) {
            subordinateClauseOpen = false;
            subordinateMode = false;
        }

        // Skip trailing noun (like prepositional phrases "in the", "to the", etc.)
        if (
            tag.startsWith("nn") &&
            i > 1 &&
            (tags[i - 2] === "in" || tags[i - 2] === "to")
        ) {
            logHTML += `<span style="color:gray; margin-left:2rem;">🛑 Skipped trailing noun: "${word}"</span>`;
            continue;
        }

        // Detect subject
        if (!hasSubject && subjectTags.includes(tag)) {
            hasSubject = true;
            lastSubject = word;
            logHTML += `<span style="color:lightgreen; margin-left:2rem;">✅ Detected SUBJECT: "${word}"</span>`;
            continue;
        }

        // Handle compound predicates or main verb detection
        if (!hasSubject && lastSubject && (verbTags.includes(tag) || tag === modalTag)) {
            const prevWord = words[i - 1]?.toLowerCase();
            const prevTag = tags[i - 1];

            const isCompoundPredicate =
                resetTriggers.includes(prevWord) &&
                !subjectTags.includes(prevTag) &&
                clauseCount > 0;

            if (isCompoundPredicate) {
                logHTML += `<span style="color:orange; margin-left:2rem;">🔗 Compound Predicate Detected: "${word}"</span>`;
                hasVerb = true;
                compoundLock = true;
                continue;
            } else {
                hasSubject = true;
                logHTML += `<span style="color:lightgreen; margin-left:2rem;">✅ Inferred SUBJECT: "${lastSubject}"</span>`;
            }
        }

        // Handle modal verbs
        if (tag === modalTag) {
            sawModal = true;
            logHTML += `<span style="color:lightskyblue; margin-left:2rem;">✅ Detected MODAL VERB: "${word}"</span>`;
            continue;
        }

        // Handle gerund traps and skipping certain verb patterns
        if (
            tag === "vbg" &&
            i >= 2 &&
            tags[i - 2].startsWith("nn") &&
            tags[i - 1] === "in"
        ) {
            logHTML += `<span style="color:red; margin-left:2rem;">🚫 Skipping Gerund Trap Pattern: "${word}"</span>`;
            continue;
        }

        // Detect verb and predicate
        if (hasSubject && !hasVerb && verbTags.includes(tag)) {
            hasVerb = true;
            if (sawModal) sawModal = false;
            logHTML += `<span style="color:lightskyblue; margin-left:2rem;">✅ Detected VERB/PREDICATE: "${word}"</span>`;
        }

        // If subject and verb are both found, count it as a main clause
        if (hasSubject && hasVerb && !compoundLock && !subordinateMode) {
            clauseCount++;
            lockClause = true;
            logHTML += `<span style="color:#FFD700; font-weight:bold; margin-left:2rem;">➡️ MAIN CLAUSE COUNTED (${clauseCount})</span>`;
            hasSubject = false;
            hasVerb = false;
            lockClause = false;
            sawModal = false;
            compoundLock = false;
        }

        // Reset clauses after encountering reset triggers like commas or conjunctions
        if (resetTriggers.includes(lowerWord)) {
            hasSubject = false;
            hasVerb = false;
            lockClause = false;
        }
    }

    // If there's an unclosed subordinate clause, count the clause at the end
    if (hasSubject && hasVerb && subordinateMode) {
        clauseCount++;
        logHTML += `<span style="color:#FFD700; font-weight:bold; margin-left:2rem;">➡️ MAIN CLAUSE COUNTED (${clauseCount}) after unclosed subordinate clause</span>`;
        subordinateMode = false;
    }

    logHTML += `<p style="color:#FFD700;"><strong>🎯 TOTAL MAIN CLAUSES DETECTED: ${clauseCount}</strong></p>`;
    logHTML += `<p style="color:#87CEEB;"><strong>🧩 TOTAL SUBORDINATE CLAUSES DETECTED: ${subordinateClauseCount}</strong></p>`;

    // Return the final result
    return {
        clauseCount,
        subordinateClauseCount
    };
}

function detectClausesFuncC(sentence) {
  const doc = nlp(sentence);
  const clauses = doc.clauses().json();

  console.log("🧩 Original Sentence:", sentence);
  console.log("📚 Total Clauses Found:", clauses.length);
  console.log("🧠 Clause Breakdown:");

  let clauseCount = 0;
  let subordinateClauseCount = 0;

  const subordinators = [
    "after", "although", "as", "because", "before", "even though", "if",
    "since", "so that", "than", "that", "though", "unless", "until",
    "when", "whenever", "where", "whereas", "wherever", "whether", "while",
    "who", "whom", "whose", "which", "why", "how"
  ];

  clauses.forEach((clause, index) => {
    const rawText = clause.text.trim();
    const text = rawText.toLowerCase();

    // Remove lead conjunctions
    const cleaned = text.replace(/^(but|and|or|so|yet|for)\s+/i, '');
    const clauseDoc = nlp(cleaned);

    const startsWithSubordinator = subordinators.some(sub => cleaned.startsWith(sub + ' '));
    const containsSubordinator = subordinators.some(sub => cleaned.includes(' ' + sub + ' ') || cleaned.includes(sub + ' '));

    const hasSubject = clauseDoc.match('#Noun').found || clauseDoc.match('#Pronoun').found;
    const hasVerb = clauseDoc.verbs().found;

    console.log(`🔍 Clause ${index + 1}: "${rawText}"`);
    console.log(`   → Starts with subordinator? ${startsWithSubordinator}`);
    console.log(`   → Contains subordinator? ${containsSubordinator}`);
    console.log(`   → Has subject? ${hasSubject} | Has verb? ${hasVerb}`);

    if ((startsWithSubordinator || containsSubordinator) && hasVerb) {
      subordinateClauseCount++;
      console.log("   → Classified as: Subordinate Clause");
    } else if (hasSubject && hasVerb) {
      clauseCount++;
      console.log("   → Classified as: Main Clause");
    } else if (hasVerb) {
      clauseCount++;
      console.log("   → Classified as: Verb Phrase Fragment (Counted as Main)");
    }
  });

  console.log("✅ Final Clause Count → Main:", clauseCount, "Subordinate:", subordinateClauseCount, "Total:", clauseCount + subordinateClauseCount);

  return {
    clauseCount,
    subordinateClauseCount
  };
}








function detectClausesFuncB(sentence) {
  let clauseCount = 0;
  let subordinateClauseCount = 0;
  let logHTML = `<h4 style="color:#FFD700;">🧠 Clause Detection Log:</h4>`;

  const subjectTags = ["prp", "nn", "nns", "nnp", "nnps"];
  const verbTags = ["vb", "vbd", "vbp", "vbz", "vbg", "vbn"];
  const modalTag = "md";
  const resetTriggers = [",", "but", "so", "or", "yet", "for", "nor", "and"];
  const subordinatingWords = [
    "after", "although", "as", "because", "before", "even though", "if",
    "since", "so that", "than", "that", "though", "unless", "until",
    "when", "whenever", "where", "whereas", "wherever", "whether", "while",
    "who", "whose", "whom", "which", "why"
  ];

  const words = RiTa.tokenize(sentence);
  const tags = RiTa.pos(sentence);

  let hasSubject = false;
  let hasVerb = false;
  let sawModal = false;
  let lockClause = false;
  let subordinateMode = false;
  let lastSubject = null;
  let skipUntilComma = false;
  let compoundLock = false;
  let waitForMainVerb = false;
  let nestedSubCount = 0;
  let participialLock = false;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const tag = tags[i];
    const lowerWord = word.toLowerCase();

    logHTML += `<span style="display:block; margin-left:1rem;">Word: <strong>${word}</strong> → Tag: ${tag}</span>`;

    if (skipUntilComma) {
      if (word === ",") {
        skipUntilComma = false;
        subordinateMode = false;
        participialLock = false;
        hasSubject = false;
        hasVerb = false;
      }
      continue;
    }

    if (i === 0 && tag === "vbg" && words.includes(",")) {
      subordinateClauseCount++;
      participialLock = true;
      skipUntilComma = true;
      logHTML += `<span style="color:#87CEEB; margin-left:2rem;">🧩 Participial Phrase: "${word}"</span>`;
      continue;
    }

    if (!subordinateMode && subordinatingWords.includes(lowerWord)) {
      subordinateMode = true;
      skipUntilComma = true;
      subordinateClauseCount++;
      logHTML += `<span style="color:#87CEEB; margin-left:2rem;">🧩 Subordinating Word: "${word}"</span>`;
      continue;
    }

    if (subordinateMode && subordinatingWords.includes(lowerWord)) {
      nestedSubCount++;
      subordinateClauseCount++;
      logHTML += `<span style="color:#87CEEB; margin-left:2rem;">🧩 Nested Subordinate: "${word}"</span>`;
      continue;
    }

    if (
      tag.startsWith("nn") &&
      i > 1 &&
      (tags[i - 2] === "in" || tags[i - 2] === "to")
    ) {
      logHTML += `<span style="color:gray; margin-left:2rem;">🛑 Skipped Trailing Noun: "${word}"</span>`;
      continue;
    }

    if (!hasSubject && subjectTags.includes(tag)) {
      hasSubject = true;
      lastSubject = word;
      logHTML += `<span style="color:lightgreen; margin-left:2rem;">✅ SUBJECT: "${word}"</span>`;
      continue;
    }

    if (!hasSubject && lastSubject && (verbTags.includes(tag) || tag === modalTag)) {
      hasSubject = true;
      logHTML += `<span style="color:lightgreen; margin-left:2rem;">✅ Inferred SUBJECT: "${lastSubject}"</span>`;
    }

    if (tag === modalTag || (hasSubject && verbTags.includes(tag) && tag !== "vbg")) {
      hasVerb = true;
      waitForMainVerb = true;
      logHTML += `<span style="color:lightskyblue; margin-left:2rem;">✅ AUX/MODAL: "${word}"</span>`;
      continue;
    }

    if (waitForMainVerb && tag === "rb") continue;

    if (waitForMainVerb && tag === "vbg") {
      waitForMainVerb = false;
      hasVerb = true;
      logHTML += `<span style="color:lightskyblue; margin-left:2rem;">✅ MAIN VERB after AUX: "${word}"</span>`;
    }

    if (
      tag === "vbg" &&
      i >= 2 &&
      tags[i - 2].startsWith("nn") &&
      tags[i - 1] === "in"
    ) {
      logHTML += `<span style="color:red; margin-left:2rem;">🚫 Gerund Trap: "${word}"</span>`;
      continue;
    }

    if (hasSubject && !hasVerb && verbTags.includes(tag)) {
      hasVerb = true;
      logHTML += `<span style="color:lightskyblue; margin-left:2rem;">✅ VERB: "${word}"</span>`;
    }

    if (hasSubject && hasVerb && !compoundLock && !subordinateMode && !participialLock && !waitForMainVerb) {
      clauseCount++;
      lockClause = true;
      logHTML += `<span style="color:#FFD700; font-weight:bold; margin-left:2rem;">➡️ MAIN CLAUSE (${clauseCount})</span>`;
      hasSubject = false;
      hasVerb = false;
      lockClause = false;
    }

    if (resetTriggers.includes(lowerWord)) {
      if (hasSubject && hasVerb && !subordinateMode) {
        clauseCount++;
        logHTML += `<span style="color:#FFD700; margin-left:2rem;">➡️ MAIN CLAUSE before conjunction (${clauseCount})</span>`;
      }
      hasSubject = false;
      hasVerb = false;
      lockClause = false;
    }
  }

  if (hasSubject && hasVerb && subordinateMode) {
    clauseCount++;
    logHTML += `<span style="color:#FFD700; font-weight:bold; margin-left:2rem;">➡️ MAIN CLAUSE after unclosed subordinate (${clauseCount})</span>`;
  }

  if (hasSubject && hasVerb && !lockClause) {
    clauseCount++;
    logHTML += `<span style="color:#FFD700; margin-left:2rem;">🟨 Final MAIN CLAUSE at end (${clauseCount})</span>`;
  }

  logHTML += `<p style="color:#FFD700;"><strong>🎯 TOTAL MAIN CLAUSES: ${clauseCount}</strong></p>`;
  logHTML += `<p style="color:#87CEEB;"><strong>🧩 TOTAL SUBORDINATE CLAUSES: ${subordinateClauseCount}</strong></p>`;

  return {
    clauseCount,
    subordinateClauseCount
  };
}



  
function detectClausesFuncB(sentence) {
  let clauseCount = 0;
  let subordinateClauseCount = 0;
  let logHTML = `<h4 style="color:#FFD700;">🧠 Clause Detection Log:</h4>`;

  const subjectTags = ["prp", "nn", "nns", "nnp", "nnps"];
  const verbTags = ["vb", "vbd", "vbp", "vbz", "vbg", "vbn"];
  const modalTag = "md";
  const resetTriggers = [",", "but", "so", "or", "yet", "for", "nor", "and"];
  const subordinatingWords = [
      "after", "although", "as", "because", "before", "even though", "if",
      "since", "so that", "than", "that", "though", "unless", "until",
      "when", "whenever", "where", "whereas", "wherever", "whether", "while",
      "who", "whose", "whom", "which", "why"
  ];

  // Step 1: Tokenize the sentence and get POS tags
  const words = RiTa.tokenize(sentence);  // Tokenize the sentence into words
  const tags = RiTa.pos(sentence);        // Get POS tags for the words

  let hasSubject = false;
  let hasVerb = false;
  let sawModal = false;
  let lockClause = false;
  let subordinateMode = false;
  let lastSubject = null;
  let skipUntilComma = false;
  let compoundLock = false;
  let waitForMainVerb = false;

  // Step 2: Process each word in the sentence
  for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const tag = tags[i];  // Access POS tags directly from the `tags` array
      const lowerWord = word.toLowerCase();

      logHTML += `<span style="display:block; margin-left:1rem;">Word: <strong>${word}</strong> → Tag: ${tag}</span>`;

      // Step 3: Handle cases where we are skipping until a comma is encountered (for subordinate clauses)
      if (skipUntilComma) {
          if (word === ",") {
              skipUntilComma = false;
              subordinateMode = false;
          }
          continue;
      }

      // Step 4: Detect subordinate clauses based on subordinating words
      if (!subordinateMode && subordinatingWords.includes(lowerWord)) {
          subordinateMode = true;
          skipUntilComma = true;
          subordinateClauseCount++;
          logHTML += `<span style="color:#87CEEB; margin-left:2rem;">🧩 Subordinating Word Triggered: "${word}"</span>`;

          // Step 5: Handle clause boundary detection (noun + verb pattern after relative pronoun)
          if (
              i + 2 < tags.length &&
              tags[i + 1].startsWith("nn") &&
              verbTags.includes(tags[i + 2])
          ) {
              subordinateMode = false;
              skipUntilComma = false;
              logHTML += `<span style="color:#87CEEB; margin-left:2rem;">🧩 Ending Subordinate Early (NOUN + VERB detected): "${words[i + 1]} ${words[i + 2]}"</span>`;
          }
          continue;
      }

      // Step 6: Skip certain patterns like "in" or "to" followed by a noun (prepositional phrases)
      if (
          tag.startsWith("nn") &&
          i > 1 &&
          (tags[i - 2] === "in" || tags[i - 2] === "to")
      ) {
          logHTML += `<span style="color:gray; margin-left:2rem;">🛑 Skipped trailing noun: "${word}"</span>`;
          continue;
      }

      // Step 7: Handle subject detection
      if (!hasSubject && subjectTags.includes(tag)) {
          hasSubject = true;
          lastSubject = word;
          logHTML += `<span style="color:lightgreen; margin-left:2rem;">✅ Detected SUBJECT: "${word}"</span>`;
          continue;
      }

      // Step 8: Handle compound predicates or main verb detection
      if (!hasSubject && lastSubject && (verbTags.includes(tag) || tag === modalTag)) {
          const prevWord = words[i - 1]?.toLowerCase();
          const prevTag = tags[i - 1];

          const isCompoundPredicate =
              resetTriggers.includes(prevWord) &&
              !subjectTags.includes(prevTag) &&
              clauseCount > 0;

          if (isCompoundPredicate) {
              logHTML += `<span style="color:orange; margin-left:2rem;">🔗 Compound Predicate Detected: "${word}"</span>`;
              hasVerb = true;
              compoundLock = true;
              continue;
          } else {
              hasSubject = true;
              logHTML += `<span style="color:lightgreen; margin-left:2rem;">✅ Inferred SUBJECT: "${lastSubject}"</span>`;
          }
      }

      // Step 9: Handle modal verbs
      if (tag === modalTag || (hasSubject && verbTags.includes(tag) && tag !== "vbg")) {
          hasVerb = true;
          waitForMainVerb = true;
          logHTML += `<span style="color:lightskyblue; margin-left:2rem;">✅ Detected AUX/MODAL VERB: "${word}"</span>`;
          continue;
      }

      if (waitForMainVerb && tag === "rb") continue;

      if (waitForMainVerb && tag === "vbg") {
          waitForMainVerb = false;
          hasVerb = true;
          logHTML += `<span style="color:lightskyblue; margin-left:2rem;">✅ Detected MAIN VERB: "${word}"</span>`;
      }

      // Step 10: Handle gerund traps and skipping certain verb patterns
      if (
          tag === "vbg" &&
          i >= 2 &&
          tags[i - 2].startsWith("nn") &&
          tags[i - 1] === "in"
      ) {
          logHTML += `<span style="color:red; margin-left:2rem;">🚫 Skipping Gerund Trap Pattern: "${word}"</span>`;
          continue;
      }

      // Step 11: Detect verb and predicate
      if (hasSubject && !hasVerb && verbTags.includes(tag)) {
          hasVerb = true;
          if (sawModal) sawModal = false;
          logHTML += `<span style="color:lightskyblue; margin-left:2rem;">✅ Detected VERB/PREDICATE: "${word}"</span>`;
      }

      // Step 12: If both subject and verb are found, count the main clause
      if (hasSubject && hasVerb && !compoundLock && !subordinateMode && !waitForMainVerb) {
          clauseCount++;
          lockClause = true;
          logHTML += `<span style="color:#FFD700; font-weight:bold; margin-left:2rem;">➡️ MAIN CLAUSE COUNTED (${clauseCount})</span>`;
          hasSubject = false;
          hasVerb = false;
          lockClause = false;
          sawModal = false;
          compoundLock = false;
      }

      // Step 13: Reset conditions after encountering certain conjunctions
      if (resetTriggers.includes(lowerWord)) {
          hasSubject = false;
          hasVerb = false;
          lockClause = false;
      }
  }

  // Step 14: Handle remaining subordinate clauses if needed
  if (hasSubject && hasVerb && subordinateMode) {
      clauseCount++;
      logHTML += `<span style="color:#FFD700; font-weight:bold; margin-left:2rem;">➡️ MAIN CLAUSE COUNTED (${clauseCount}) after unclosed subordinate clause</span>`;
      subordinateMode = false;
  }

  // Step 15: Log and return the final counts
  logHTML += `<p style="color:#FFD700;"><strong>🎯 TOTAL MAIN CLAUSES DETECTED: ${clauseCount}</strong></p>`;
  logHTML += `<p style="color:#87CEEB;"><strong>🧩 TOTAL SUBORDINATE CLAUSES DETECTED: ${subordinateClauseCount}</strong></p>`;

  // Return the final result
  return {
      clauseCount,
      subordinateClauseCount
  };
}


    
  
  /*Handles test cases:
  1) The boy who wore a red hat ran quickly.
  2) He walk to the store and buyed some apples.
  3) I love learning, so I spend a lot of time reading. 
  4) I took the dog to the park.
  5) She sings but dances poorly.
  Fails:
  1) Although it was late, they kept working. 
  2) The cat, who meows loudly, is also scratching on the door.
  */


  /*function detectClauses(text) {
    const sentences = RiTa.sentences(text);
    let clauseCount = 0;
    let subordinateClauseCount = 0;
    let logHTML = `<h4 style="color:#FFD700;">🧠 Clause Detection Log:</h4>`;

    const subjectTags = ["prp", "nn", "nns", "nnp", "nnps"];
    const verbTags = ["vb", "vbd", "vbp", "vbz", "vbg", "vbn"];
    const modalTag = "md";
    const resetTriggers = [",", "but", "so", "or", "yet", "for", "nor", "and"];
    const subordinatingWords = [
      "after", "although", "as", "because", "before", "even though", "if",
      "since", "so that", "than", "that", "though", "unless", "until",
      "when", "whenever", "where", "whereas", "wherever", "whether", "while",
      "who", "whose", "whom", "which", "why"
    ];

    for (const sentence of sentences) {
      logHTML += `<p><strong>🔍 Analyzing:</strong> "${sentence.trim()}"</p>`;

      const words = RiTa.tokenize(sentence);
      const tags = RiTa.pos(sentence);

      let hasSubject = false;
      let hasVerb = false;
      let sawModal = false;
      let lockClause = false;
      let subordinateMode = false;
      let subordinateClauseOpen = false;
      let lastSubject = null;
      let compoundLock = false;

      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const tag = tags[i];
        const lowerWord = word.toLowerCase();

        logHTML += `<span style="display:block; margin-left:1rem;">Word: <strong>${word}</strong> → Tag: ${tag}</span>`;

        if (!subordinateMode && subordinatingWords.includes(lowerWord)) {
          subordinateMode = true;
          subordinateClauseOpen = true;
          subordinateClauseCount++;
          logHTML += `<span style="color:#87CEEB; margin-left:2rem;">🧩 Subordinating Word Triggered: "${word}"</span>`;
          hasSubject = false;
          hasVerb = false;
          continue;
        }

        if (lowerWord === "," && subordinateClauseOpen) {
          subordinateClauseOpen = false;
          subordinateMode = false;
        }

        if (
          tag.startsWith("nn") &&
          i > 1 &&
          (tags[i - 2] === "in" || tags[i - 2] === "to")
        ) {
          logHTML += `<span style="color:gray; margin-left:2rem;">🛑 Skipped trailing noun: "${word}"</span>`;
          continue;
        }

        if (!hasSubject && subjectTags.includes(tag)) {
          hasSubject = true;
          lastSubject = word;
          logHTML += `<span style="color:lightgreen; margin-left:2rem;">✅ Detected SUBJECT: "${word}"</span>`;
          continue;
        }

        if (!hasSubject && lastSubject && (verbTags.includes(tag) || tag === modalTag)) {
          const prevWord = words[i - 1]?.toLowerCase();
          const prevTag = tags[i - 1];

          const isCompoundPredicate =
            resetTriggers.includes(prevWord) &&
            !subjectTags.includes(prevTag) &&
            clauseCount > 0;

          if (isCompoundPredicate) {
            logHTML += `<span style="color:orange; margin-left:2rem;">🔗 Compound Predicate Detected: "${word}"</span>`;
            hasVerb = true;
            compoundLock = true;
            continue;
          } else {
            hasSubject = true;
            logHTML += `<span style="color:lightgreen; margin-left:2rem;">✅ Inferred SUBJECT: "${lastSubject}"</span>`;
          }
        }

        if (tag === modalTag) {
          sawModal = true;
          logHTML += `<span style="color:lightskyblue; margin-left:2rem;">✅ Detected MODAL VERB: "${word}"</span>`;
          continue;
        }

        if (
          tag === "vbg" &&
          i >= 2 &&
          tags[i - 2].startsWith("nn") &&
          tags[i - 1] === "in"
        ) {
          logHTML += `<span style="color:red; margin-left:2rem;">🚫 Skipping Gerund Trap Pattern: "${word}"</span>`;
          continue;
        }

        if (
          tag === "vbg" &&
          i > 0 &&
          verbTags.includes(tags[i - 1])
        ) {
          logHTML += `<span style="color:red; margin-left:2rem;">🚫 Skipping Complement Gerund: "${word}"</span>`;
          continue;
        }

        if (
          tag === "vbg" &&
          i >= 3 &&
          tags[i - 3].startsWith("nn") &&
          tags[i - 2] === "in" &&
          tags[i - 1].startsWith("nn")
        ) {
          logHTML += `<span style="color:red; margin-left:2rem;">🚫 Skipping Noun-of-Noun Gerund: "${word}"</span>`;
          continue;
        }

        if (hasSubject && !hasVerb && verbTags.includes(tag)) {
          hasVerb = true;
          if (sawModal) sawModal = false;
          logHTML += `<span style="color:lightskyblue; margin-left:2rem;">✅ Detected VERB/PREDICATE: "${word}"</span>`;
        }

        if (hasSubject && hasVerb && !compoundLock && !subordinateMode) {
          clauseCount++;
          lockClause = true;
          logHTML += `<span style="color:#FFD700; font-weight:bold; margin-left:2rem;">➡️ MAIN CLAUSE COUNTED (${clauseCount})</span>`;
          hasSubject = false;
          hasVerb = false;
          lockClause = false;
          sawModal = false;
          compoundLock = false;
        }

        if (resetTriggers.includes(lowerWord)) {
          hasSubject = false;
          hasVerb = false;
          lockClause = false;
        }
      }

      if (hasSubject && hasVerb && subordinateMode) {
        clauseCount++;
        logHTML += `<span style="color:#FFD700; font-weight:bold; margin-left:2rem;">➡️ MAIN CLAUSE COUNTED (${clauseCount}) after unclosed subordinate clause</span>`;
        subordinateMode = false;
      }
    }

    const mainClauses = clauseCount;

    logHTML += `<p style="color:#FFD700;"><strong>🎯 TOTAL MAIN CLAUSES DETECTED: ${mainClauses}</strong></p>`;
    logHTML += `<p style="color:#87CEEB;"><strong>🧩 TOTAL SUBORDINATE CLAUSES DETECTED: ${subordinateClauseCount}</strong></p>`;

    document.getElementById("clauseDebugLog").innerHTML = logHTML;
    document.getElementById("clauseDisplay").textContent = mainClauses;
    document.getElementById("subordinateClauseDisplay").textContent = subordinateClauseCount;

    return {
      clauseCount: mainClauses,
      subordinateClauseCount
    };
  }*/
    


    /* This handles test cases: 
    1) The cat, who meows loudly, is also scratching on the door.
    2) I love learning, so I spend a lot of time reading.  
    3) Although it was late, they kept working. 
    Fail: 
    1) The boy who wore a red hat ran quickly.
    2) She sings but dances poorly.
    3) He walk to the store and buyed some apples.
    4) I took the dog to the park.  */ 
    

    /*
    function detectClauses(text) {
      const sentences = RiTa.sentences(text);
      let clauseCount = 0;
      let subordinateClauseCount = 0;
      let logHTML = `<h4 style="color:#FFD700;">🧠 Clause Detection Log:</h4>`;
    
      const subjectTags = ["prp", "nn", "nns", "nnp", "nnps"];
      const verbTags = ["vb", "vbd", "vbp", "vbz", "vbg", "vbn"];
      const modalTag = "md";
      const resetTriggers = [",", "but", "so", "or", "yet", "for", "nor", "and"];
      const subordinatingWords = [
        "after", "although", "as", "because", "before", "even though", "if",
        "since", "so that", "than", "that", "though", "unless", "until",
        "when", "whenever", "where", "whereas", "wherever", "whether", "while",
        "who", "whose", "whom", "which", "why"
      ];
    
      for (const sentence of sentences) {
        logHTML += `<p><strong>🔍 Analyzing:</strong> "${sentence.trim()}"</p>`;
        const words = RiTa.tokenize(sentence);
        const tags = RiTa.pos(sentence);
    
        let hasSubject = false;
        let hasVerb = false;
        let sawModal = false;
        let lockClause = false;
        let subordinateMode = false;
        let lastSubject = null;
        let skipUntilComma = false;
        let compoundLock = false;
        let waitForMainVerb = false;
    
        for (let i = 0; i < words.length; i++) {
          const word = words[i];
          const tag = tags[i];
          const lowerWord = word.toLowerCase();
    
          logHTML += `<span style="display:block; margin-left:1rem;">Word: <strong>${word}</strong> → Tag: ${tag}</span>`;
    
          if (skipUntilComma) {
            if (word === ",") {
              skipUntilComma = false;
              subordinateMode = false;
            }
            continue;
          }
    
          if (!subordinateMode && subordinatingWords.includes(lowerWord)) {
            subordinateMode = true;
            skipUntilComma = true;
            subordinateClauseCount++;
            logHTML += `<span style="color:#87CEEB; margin-left:2rem;">🧩 Subordinating Word Triggered: "${word}"</span>`;
    
            // Extra clause boundary detection: noun + verb pattern after relative pronoun
            if (
              i + 2 < tags.length &&
              tags[i + 1].startsWith("nn") &&
              verbTags.includes(tags[i + 2])
            ) {
              subordinateMode = false;
              skipUntilComma = false;
              logHTML += `<span style="color:#87CEEB; margin-left:2rem;">🧩 Ending Subordinate Early (NOUN + VERB detected): "${words[i + 1]} ${words[i + 2]}"</span>`;
            }
            continue;
          }
    
          if (
            tag.startsWith("nn") &&
            i > 1 &&
            (tags[i - 2] === "in" || tags[i - 2] === "to")
          ) {
            logHTML += `<span style="color:gray; margin-left:2rem;">🛑 Skipped trailing noun: "${word}"</span>`;
            continue;
          }
    
          if (!hasSubject && subjectTags.includes(tag)) {
            hasSubject = true;
            lastSubject = word;
            logHTML += `<span style="color:lightgreen; margin-left:2rem;">✅ Detected SUBJECT: "${word}"</span>`;
            continue;
          }
    
          if (!hasSubject && lastSubject && (verbTags.includes(tag) || tag === modalTag)) {
            const prevWord = words[i - 1]?.toLowerCase();
            const prevTag = tags[i - 1];
    
            const isCompoundPredicate =
              resetTriggers.includes(prevWord) &&
              !subjectTags.includes(prevTag) &&
              clauseCount > 0;
    
            if (isCompoundPredicate) {
              logHTML += `<span style="color:orange; margin-left:2rem;">🔗 Compound Predicate Detected: "${word}"</span>`;
              hasVerb = true;
              compoundLock = true;
              continue;
            } else {
              hasSubject = true;
              logHTML += `<span style="color:lightgreen; margin-left:2rem;">✅ Inferred SUBJECT: "${lastSubject}"</span>`;
            }
          }
    
          if (tag === modalTag || (hasSubject && verbTags.includes(tag) && tag !== "vbg")) {
            hasVerb = true;
            waitForMainVerb = true;
            logHTML += `<span style="color:lightskyblue; margin-left:2rem;">✅ Detected AUX/MODAL VERB: "${word}"</span>`;
            continue;
          }
    
          if (waitForMainVerb && tag === "rb") continue;
    
          if (waitForMainVerb && tag === "vbg") {
            waitForMainVerb = false;
            hasVerb = true;
            logHTML += `<span style="color:lightskyblue; margin-left:2rem;">✅ Detected MAIN VERB: "${word}"</span>`;
          }
    
          if (
            tag === "vbg" &&
            i >= 2 &&
            tags[i - 2].startsWith("nn") &&
            tags[i - 1] === "in"
          ) {
            logHTML += `<span style="color:red; margin-left:2rem;">🚫 Skipping Gerund Trap Pattern: "${word}"</span>`;
            continue;
          }
    
          if (
            tag === "vbg" &&
            i > 0 &&
            verbTags.includes(tags[i - 1])
          ) {
            logHTML += `<span style="color:red; margin-left:2rem;">🚫 Skipping Complement Gerund: "${word}"</span>`;
            continue;
          }
    
          if (
            tag === "vbg" &&
            i >= 3 &&
            tags[i - 3].startsWith("nn") &&
            tags[i - 2] === "in" &&
            tags[i - 1].startsWith("nn")
          ) {
            logHTML += `<span style="color:red; margin-left:2rem;">🚫 Skipping Noun-of-Noun Gerund: "${word}"</span>`;
            continue;
          }
    
          if (hasSubject && hasVerb && !compoundLock && !subordinateMode && !waitForMainVerb) {
            clauseCount++;
            lockClause = true;
            logHTML += `<span style="color:#FFD700; font-weight:bold; margin-left:2rem;">➡️ MAIN CLAUSE COUNTED (${clauseCount})</span>`;
            hasSubject = false;
            hasVerb = false;
            lockClause = false;
            sawModal = false;
            compoundLock = false;
          }
    
          if (resetTriggers.includes(lowerWord)) {
            hasSubject = false;
            hasVerb = false;
            lockClause = false;
          }
        }
      }
    
      const mainClauses = Math.max(0, clauseCount);
      logHTML += `<p style="color:#FFD700;"><strong>🎯 TOTAL MAIN CLAUSES DETECTED: ${mainClauses}</strong></p>`;
      logHTML += `<p style="color:#87CEEB;"><strong>🧩 TOTAL SUBORDINATE CLAUSES DETECTED: ${subordinateClauseCount}</strong></p>`;
    
      document.getElementById("clauseDebugLog").innerHTML = logHTML;
      document.getElementById("clauseDisplay").textContent = mainClauses;
      document.getElementById("subordinateClauseDisplay").textContent = subordinateClauseCount;
    
      return {
        clauseCount: mainClauses,
        subordinateClauseCount
      };
    }*/
    
      

  function drawClauseChart(clauseCount, totalSentences, totalClauses) {
    const axisColor = '#D27D2D';
    const estimatedMax = Math.ceil(clauseCount * 2); // In case of compound sentences
  
    const ctx = document.getElementById('clauseChart').getContext('2d');

  // 🧹 Destroy old chart safely
  if (charts.clauseChart) {
    charts.clauseChart.destroy();
  }

  // 🎯 Create and save the new chart
  charts.clauseChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Your Story'],
        datasets: [{
          label: 'Main Clauses',
          data: [clauseCount],
          borderColor: '#FFD700',
          backgroundColor: 'rgb(107, 63, 148, 0.6)',
          tension: 0.3,
          fill: true,
          pointRadius: 5,
          borderWidth: 2,
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            max: totalClauses,
            ticks: {
              stepSize: Math.max(1, Math.ceil(totalClauses / 5)) ,
              color: axisColor
            },
            grid: { color: axisColor }
          },
          x: {
            ticks: { color: axisColor },
            grid: { color: axisColor }
          }
        },
        plugins: {
          legend: {
            labels: { color: axisColor }
          }
        }
      }
    });
  }
  
  
  function drawSubordinateClauseChart(subordinateClauseCount, clauseCount, totalClauses) {
    const axisColor = '#D27D2D';
    const estimatedMax = Math.ceil(clauseCount * 2) || 2; // ensure room to show full ratio
  
    const ctx = document.getElementById('subordinateClauseChart').getContext('2d');

    // 🧹 Destroy old chart safely
    if (charts.subordinateClauseChart) {
      charts.subordinateClauseChart.destroy();
    }
  
    // 🎯 Create and save the new chart
    charts.subordinateClauseChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Your Story'],
        datasets: [{
          label: 'Subordinate Clauses',
          data: [subordinateClauseCount],
          borderColor: '#FFD700',
          backgroundColor: 'rgb(107, 63, 148, 0.6)', // same golden yellow as #FFD700
          tension: 0.3,
          fill: true,
          pointRadius: 5,
          borderWidth: 2,
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            max: totalClauses,
            ticks: {
              stepSize: Math.max(1, Math.ceil(totalClauses / 5)),
              color: axisColor
            },
            grid: { color: axisColor }
          },
          x: {
            ticks: { color: axisColor },
            grid: { color: axisColor }
          }
        },
        plugins: {
          legend: {
            labels: { color: axisColor }
          }
        }
      }
    });
  }
  
  
  
  // Enhanced Verb Error Detection with Contextual Tense Patterns using Compromise
  function detectVerbErrors(text) {
    const doc = nlp(text).normalize({ contractions: true }); // normalize full input
    const sentences = doc.sentences().out('array');
    let verbErrorCount = 0;
    const errorList = [];
  
    const temporalCues = {
      past: [
        "yesterday", "last", "ago", "before", "once", "earlier today", "previously",
        "a few minutes ago", "the other day", "had", "was", "were", "did"
      ],
      present: [
        "now", "currently", "today", "as we speak", "right now", "is", "are", "do", "does"
      ],
      future: [
        "tomorrow", "next", "soon", "later", "in the future", "by next week", "in a moment",
        "by tomorrow", "shall", "will", "going to"
      ]
    };
  
    function getTimeContext(sentence) {
      const lower = sentence.toLowerCase();
      for (const cue of temporalCues.past) if (lower.includes(cue)) return "PastTense";
      for (const cue of temporalCues.present) if (lower.includes(cue)) return "PresentTense";
      for (const cue of temporalCues.future) if (lower.includes(cue)) return "FutureTense";
      return null;
    }
  
    let lastTenseContext = null;
  
    for (const sentence of sentences) {
      const context = getTimeContext(sentence);
      const activeContext = context || lastTenseContext || "PastTense";
      if (context) lastTenseContext = context;
  
      const sDoc = nlp(sentence).normalize({ contractions: true });
      const verbs = sDoc.verbs();
  
      console.log(`📘 Analyzing sentence: "${sentence}"`);
  
      verbs.termList().forEach((termObj, idx) => {
        const termText = termObj.text.toLowerCase().trim();
      
        // ⛔ Skip modal/helper-only tokens
        const skipWords = ['will','are', 'shall', 'should', 'can', 'could', 'may', 'might', 'must', 'would',
                           'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did'];
        if (skipWords.includes(termText)) return;
      
        const singleVerb = nlp(termText).verbs().eq(0);
        if (!singleVerb.found) return;
      
        const base = singleVerb.toInfinitive().out('text').split(' ')[0];
        const pastTense = singleVerb.toPastTense().out('text').split(' ')[0];
        const presentTense = singleVerb.toPresentTense().out('text').split(' ')[0];
        const futureTense = "will " + base;
      
        console.log(`🔍 Verb ${idx + 1}:`, {
          text: termText,
          root: base,
          pastTense,
          presentTense,
          futureTense,
          activeContext
        });
      
        let expectedForm = '';
        switch (activeContext) {
          case 'PastTense': expectedForm = pastTense; break;
          case 'PresentTense': expectedForm = presentTense; break;
          case 'FutureTense': expectedForm = futureTense; break;
          default: return;
        }
      
        const actualClean = termText.toLowerCase().trim();
        const expectedClean = expectedForm.toLowerCase().trim();
      
        if (expectedClean && actualClean !== expectedClean) {
          verbErrorCount++;
          errorList.push(
            `❌ Verb: "${termText}" → should be "${expectedForm}" based on context: ${activeContext}`
          );
        }
      });
    }
  
    // UI Output
    document.getElementById("verbErrorDisplay").innerHTML = `<strong>${verbErrorCount}</strong>`;
    const logList = document.getElementById("verbErrorLog");
    logList.innerHTML = "";
    errorList.forEach(err => {
      const li = document.createElement("li");
      li.textContent = err;
      logList.appendChild(li);
    });
  
    return verbErrorCount;
  }
  
  
  
  
  
  
  
  

  
  
  

  
  
  
  
  
  
  
  
  

  
  

  
  
  
  
  
  
  
  
  
  
  
  




  
  

function drawSynaticSubordinateIndexChart(subordinationIndex) {
    const axisColor = '#D27D2D'; // Same Lakers-inspired tone

    const ctx = document.getElementById('synaticSubordinationIndexChart').getContext('2d');

  // 🧹 Destroy old chart safely
  if (charts.synaticSubordinationIndexChart) {
    charts.synaticSubordinationIndexChart.destroy();
  }

  // 🎯 Create and save the new chart
  charts.synaticSubordinationIndexChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Your Story'],
        datasets: [{
          label: 'Subordination Index (0–1 Scale)',
          data: [parseFloat(subordinationIndex)],
          borderColor: '#FFD700',
          backgroundColor: 'rgba(107, 63, 148, 0.6)',
          tension: 0.3,
          fill: true,
          pointRadius: 5,
          borderWidth: 2,
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            max: 1,
            ticks: {
              stepSize: 0.1,
              color: axisColor
            },
            grid: { color: axisColor }
          },
          x: {
            ticks: { color: axisColor },
            grid: { color: axisColor }
          }
        },
        plugins: {
          legend: {
            labels: { color: axisColor }
          }
        }
      }
    });
  }

  function detectCohesion(text) {
    const sentences = RiTa.sentences(text);
    const words = RiTa.tokenize(text);
    const tags = RiTa.pos(text);
  
    const pronouns = tags.filter(tag => tag === "prp").length;
    const temporalMarkers = words.filter(w =>
      ["then", "after", "before", "later", "now", "when", "while", "as soon as", "eventually", "until"].includes(w.toLowerCase())
    ).length;
  
    const logicalConnectors = words.filter(w =>
      ["because", "so", "although", "however", "but", "therefore", "meanwhile", "since", "if", "though"].includes(w.toLowerCase())
    ).length;
  
    // Noun stem repetition
    const nounIndices = tags
      .map((tag, i) => (tag.startsWith("nn") ? i : -1))
      .filter(index => index !== -1);
  
    const nounStems = nounIndices.map(i => RiTa.stem(words[i]));
    const stemCounts = {};
    nounStems.forEach(stem => {
      stemCounts[stem] = (stemCounts[stem] || 0) + 1;
    });
  
    const repeatedNounStems = Object.values(stemCounts).filter(count => count > 1).length;
  
    const cohesiveLinks = pronouns + temporalMarkers + logicalConnectors + repeatedNounStems;
  
    const { clauseCount, subordinateClauseCount } = detectClauses(text);
    const totalClauses = clauseCount + subordinateClauseCount;
  
    const cohesionScore = totalClauses === 0
      ? 0
      : Math.min((cohesiveLinks / (totalClauses * 2)) * 100, 100);
  
      return (cohesionScore / 100).toFixed(2);
  }
  
  function drawCohesionChart(cohesionIndex) {
    const axisColor = '#D27D2D'; // Your preferred axis color
  

    const ctx = document.getElementById('cohesionChart').getContext('2d');

  // 🧹 Destroy old chart safely
  if (charts.cohesionChart) {
    charts.cohesionChart.destroy();
  }

  // 🎯 Create and save the new chart
  charts.cohesionChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Your Story'],
        datasets: [{
          label: 'Cohesion (0–1 Scale)',
          data: [parseFloat(cohesionIndex)],
          borderColor: '#FFD700',
          backgroundColor: 'rgba(107, 63, 148, 0.6)',
          borderWidth: 2
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            max: 1,
            ticks: {
              stepSize: 0.1,
              callback: function(value) {
                return value.toFixed(1); // 0.0, 0.1, ..., 1.0
              },
              color: axisColor
            },
            grid: { color: axisColor }
          },
          x: {
            ticks: { color: axisColor },
            grid: { color: axisColor }
          }
        },
        plugins: {
          legend: {
            labels: { color: axisColor }
          }
        }
      }
    });
  }
  
  
  
  function drawVerbErrorsChart(verbErrors, totalWords) {
    const axisColor = '#D27D2D'; // Lakers Purple
  
    const ctx = document.getElementById('verbErrorChart').getContext('2d');

  // 🧹 Destroy old chart safely
  if (charts.verbErrorChart) {
    charts.verbErrorChart.destroy();
  }

  // 🎯 Create and save the new chart
  charts.verbErrorChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Your Story'],
        datasets: [{
          label: 'Verb Errors',
          data: [verbErrors],
          borderColor: '#FFD700',
          backgroundColor: 'rgb(107, 63, 148, 0.6)', // Same purple tone
          tension: 0.3,
          fill: true,
          pointRadius: 5,
          borderWidth: 2
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            max: totalWords,
            ticks: {
              stepSize: Math.ceil(totalWords / 5),
              color: axisColor
            },
            grid: { color: axisColor }
          },
          x: {
            ticks: { color: axisColor },
            grid: { color: axisColor }
          }
        },
        plugins: {
          legend: {
            labels: { color: axisColor }
          }
        }
      }
    });
  }
  
  function drawVerbErrorsPerClauseChart(verbErrorPerClause) {
    const axisColor = '#D27D2D'; // Same Lakers-inspired tone
  
    const ctx = document.getElementById('verbErrorsPerClauseChart').getContext('2d');

    // 🧹 Destroy old chart safely
    if (charts.verbErrorsPerClauseChart) {
      charts.verbErrorsPerClauseChart.destroy();
    }
  
    // 🎯 Create and save the new chart
    charts.verbErrorsPerClauseChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Your Story'],
        datasets: [{
          label: 'Verb Errors Per Clause (0–1 Scale)',
          data: [parseFloat(verbErrorPerClause)],
          borderColor: '#FFD700',
          backgroundColor: 'rgba(107, 63, 148, 0.6)',
          tension: 0.3,
          fill: true,
          pointRadius: 5,
          borderWidth: 2
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            max: 1,
            ticks: {
              stepSize: 0.1,
              color: axisColor
            },
            grid: { color: axisColor }
          },
          x: {
            ticks: { color: axisColor },
            grid: { color: axisColor }
          }
        },
        plugins: {
          legend: {
            labels: { color: axisColor }
          }
        }
      }
    });
  }
  
  
  function detectWordChoiceErrors(text) {
    const doc = nlp(text);
    let wordChoiceErrorCount = 0;
    const errorList = [];
  
  
    // 🚫 4. Inappropriate/forbidden words
    const forbiddenWords = [
      // Profanity (mild to strong)
      'damn', 'hell', 'shit', 'ass', 'bastard', 'crap', 'douche', 'fuck', 'fucking', 'fucked',
      'bitch', 'piss', 'dick', 'cock', 'balls', 'bollocks', 'bugger', 'bloody',
      'prick', 'slut', 'whore', 'wanker', 'jerk', 'retard', 'screw', 'nasty',
    
      // Explicit or adult content
      'porn', 'porno', 'nude', 'nudity', 'sex', 'sexy', 'stripper', 'boobs', 'tits',
      'vagina', 'penis', 'cum', 'blowjob', 'handjob', 'orgasm', 'masturbate', 'fetish',
    
      // Drug-related terms
      'drugs', 'weed', 'marijuana', 'cocaine', 'heroin', 'meth', 'ecstasy', 'lsd', 'dope',
      'high', 'stoned', 'bong', 'overdose', 'pills', 'narcotics', 'addict', 'snort',
    
      // Suicide / self-harm (sensitive)
      'suicide', 'kill', 'die', 'cutting', 'cut', 'hang', 'bleed', 'jump off', 'depressed',
    
      // Violence / weaponry
      'stab', 'shoot', 'bomb', 'gun', 'murder', 'abuse', 'rape', 'threat', 'torture',
      'knife', 'bullet', 'war', 'explode', 'terror', 'choke', 'slaughter', 'dead',
    
      // Hate behavior (PG-safe terms)
      'hate', 'racist', 'bully', 'nazi', 'sexist', 'pervert', 'creep', 'toxic', 'jerk'
    ];
    
    const flagged = doc.lookup(forbiddenWords);
    flagged.forEach(term => {
      wordChoiceErrorCount++;
      errorList.push(`🚫 Inappropriate word: "${term.out('text')}"`);
    });
  
    // 🧾 UI Update
    document.getElementById("wordChoiceDisplay").innerHTML = `${wordChoiceErrorCount}`;
    const logList = document.getElementById("wordChoiceLog");
    logList.innerHTML = "";
    errorList.forEach(err => {
      const li = document.createElement("li");
      li.textContent = err;
      logList.appendChild(li);
    });
  
    return wordChoiceErrorCount;
  }
  
  
  
  function drawWordChoiceErrorsChart(wordChoiceErrors, totalWords) {
    const axisColor = '#D27D2D'; // Lakers Purple

    const ctx = document.getElementById('wordChoiceChart').getContext('2d');

  // 🧹 Destroy old chart safely
  if (charts.wordChoiceChart) {
    charts.wordChoiceChart.destroy();
  }

  // 🎯 Create and save the new chart
  charts.wordChoiceChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Your Story'],
        datasets: [{
          label: 'Word Choice Errors',
          data: [wordChoiceErrors],
          borderColor: '#FFD700',
          backgroundColor: 'rgb(107, 63, 148, 0.6)',
          tension: 0.3,
          fill: true,
          pointRadius: 5,
          borderWidth: 2,
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            max: totalWords,
            ticks: {
              stepSize: Math.ceil(totalWords / 5),
              color: axisColor
            },
            grid: { color: axisColor }
          },
          x: {
            ticks: { color: axisColor },
            grid: { color: axisColor }
          }
        },
        plugins: {
          legend: {
            labels: { color: axisColor }
          }
        }
      }
    });
  }

  function drawWordChoiceErrorsRatioChart(wordChoiceErrorsRatio) {
    const axisColor = '#D27D2D';

    const ctx = document.getElementById('wordChoiceErrorsRatioChart').getContext('2d');

  // 🧹 Destroy old chart safely
  if (charts.wordChoiceErrorsRatioChart) {
    charts.wordChoiceErrorsRatioChart.destroy();
  }

  // 🎯 Create and save the new chart
  charts.wordChoiceErrorsRatioChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Your Story'],
        datasets: [{
          label: 'Word Choice Errors Ratio (0–1 Scale)',
          data: [parseFloat(wordChoiceErrorsRatio)],
          borderColor: '#FFD700',
          backgroundColor: 'rgba(107, 63, 148, 0.6)',
          tension: 0.3,
          fill: true,
          pointRadius: 5,
          borderWidth: 2,
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            max: 1,
            ticks: {
              stepSize: 0.1,
              color: axisColor
            },
            grid: { color: axisColor }
          },
          x: {
            ticks: { color: axisColor },
            grid: { color: axisColor }
          }
        },
        plugins: {
          legend: {
            labels: { color: axisColor }
          }
        }
      }
    });
  }
  
  const dropzone = document.getElementById('dropzone');

// Highlight textarea on drag
dropzone.addEventListener('dragover', function(e) {
  e.preventDefault();
  dropzone.classList.add('dragover');
});

// Remove highlight when leave
dropzone.addEventListener('dragleave', function(e) {
  e.preventDefault();
  dropzone.classList.remove('dragover');
});

// Handle file drop
dropzone.addEventListener('drop', function(e) {
  e.preventDefault();
  dropzone.classList.remove('dragover');
  
  const file = e.dataTransfer.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(event) {
      storyInput.value = event.target.result;
    };

    if (file.name.endsWith(".txt")) {
      reader.readAsText(file);
    } else {
      alert("Only .txt files are supported for drag & drop.");
    }
  }
});
