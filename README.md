<div align="center">

# 🐧 Old Memory

### A modern reimagining of the classic Tux Typing experience.

Type before the words reach the ground. Improve your speed, accuracy, and reflexes in a fast-paced browser game built entirely with HTML5 Canvas and Vanilla JavaScript.

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6-yellow)
![Canvas](https://img.shields.io/badge/HTML5-Canvas-orange)
![Status](https://img.shields.io/badge/Status-Completed-success)

---

🎮 **Play Online:** *Coming Soon*

📹 **Gameplay Demo**

<img src="./assets/demo.gif" width="800">

</div>

---

# Overview

Old Memory is a browser-based typing game inspired by the classic **Tux Typing**.

Words continuously fall from the top of the screen, and the player must type them correctly before they reach the bottom. As the game progresses, words spawn faster and movement speed increases, creating an increasingly challenging experience.

The project is built completely with **HTML5 Canvas** and **Vanilla JavaScript**, requiring no frameworks or build tools.

---

# Engine Architecture

```
Input Manager
      │
      ▼
Game Engine
      │
 ┌────┴─────┐
 │          │
 ▼          ▼
Physics   Spawn System
 │          │
 ▼          ▼
Collision Difficulty
 │
 ▼
Renderer
 │
 ▼
Particle System
 │
 ▼
UI Layer
```

---

# Engine Features

- High-performance requestAnimationFrame game loop
- Delta-time based updates
- Word spawning system
- Dynamic difficulty scaling
- Collision detection
- Input processing
- Score manager
- State manager
- Pause / Resume support
- Restart system
- Local high score persistence
- Modular architecture

---

# Rendering

- HTML5 Canvas rendering
- Smooth animations
- Responsive canvas scaling
- Clean object rendering pipeline
- Layered drawing system

---

# Gameplay

- Endless survival mode
- Increasing word speed
- Increasing spawn rate
- Score multiplier
- Accuracy tracking
- High score system

---

# Tech Stack

| Technology | Purpose |
|------------|---------|
| HTML5 | Structure |
| CSS3 | Styling |
| JavaScript (ES6) | Game Logic |
| HTML5 Canvas | Rendering |
| LocalStorage | High Scores |

---

# Project Structure

```
old-memory/
│
├── index.html
├── style.css
│
├── js/
│   ├── game.js
│   ├── engine.js
│   ├── renderer.js
│   ├── input.js
│   ├── particles.js
│   ├── words.js
│   ├── ui.js
│   └── storage.js
│
├── assets/
│   ├── images/
│   ├── sounds/
│   └── demo.gif
│
└── README.md
```

---

# My Contribution (Game Engine)

As the **Engine Developer**, I designed and implemented the core gameplay systems powering the project.

### Core Responsibilities

- Designed the game loop
- Implemented the update/render pipeline
- Built the spawning system
- Developed collision detection
- Implemented difficulty progression
- Managed game states
- Built the scoring system
- Optimized performance
- Refactored engine modules
- Integrated LocalStorage

---

# Performance

- Modular architecture
- Separation of engine and rendering
- Efficient update cycle
- Lightweight rendering
- Zero dependencies
- Fast startup
- Optimized Canvas rendering

---

# Future Improvements

- Combo multiplier
- Leaderboards
- Multiple game modes
- Theme system
- Mobile support
- Sound settings
- Word categories
- Difficulty presets

---

# Getting Started

Clone the repository

```bash
git clone https://github.com/<username>/old-memory.git
```

Open the project

```bash
cd old-memory
```

Run locally

```bash
open index.html
```

or simply open **index.html** in your browser.

---

# License

This project is licensed under the MIT License.

---

<div align="center">

### Built with HTML5 Canvas • Vanilla JavaScript • ❤️

</div>