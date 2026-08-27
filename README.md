# 🐘 KEENOII Project Sentinel (AI Project Portfolio Command Center)

> **Engineering Intelligence & Visual Cyberpunk Command Center for Local Developer Projects**

**KEENOII Project Sentinel** คือระบบศูนย์บัญชาการพอร์ตโฟลิโอและมอนิเตอร์โปรเจกต์ระดับ Local/Server อัจฉริยะ ออกแบบมาเพื่อสแกนโฟลเดอร์งานบนเครื่องของนักพัฒนา (เช่น `D:\MyProject\*` หรือ Path อื่นๆ), ประเมินคะแนนสุขภาพโค้ดแบบแม่นยำ (0–100 Health Score), ตรวจจับหนี้ทางเทคนิค (Technical Debt / TODOs), มอนิเตอร์ Live Uptime, และให้คำแนะนำทางวิศวกรรมซอฟต์แวร์โดย **Typhoon AI (SCB 10X)**, **Google Gemini**, และ **Local Ollama**

---

## 🌟 จุดเด่นสำคัญ (Key Highlights)

- ⚡ **Zero-Config Database (ไม่ต้องติดตั้งฐานข้อมูล)**: ขับเคลื่อนด้วย **Native SQLite (`node:sqlite`)** ในตัวแบบ Embedded ไม่ต้องลง MySQL, Postgres หรือ Docker ใดๆ รันเสร็จพร้อมใช้งานทันที (< 1 วินาที)
- 🏢 **2.5D Holographic Virtual Office**: เปลี่ยนโฟลเดอร์โค้ดให้กลายเป็นสำนักงาน 2.5D สุดเท่ พร้อมระบบจัดการหลายอาคาร (Multi-Building), แกลเลอรีเปลี่ยนภาพพื้นหลัง, และระบบบรรจุพนักงาน/บอทประจำแต่ละโต๊ะทำงาน
- 🧠 **Project Memory & Cockpit**: จดจำประวัติการตัดสินใจ (Architecture Decisions), เป้าหมายปัจจุบัน (Goal Box), คอขวด (Blockers), และบันทึกคำแนะนำจาก AI ลงไทม์ไลน์ถาวร
- 🔒 **Zero Code Leakage (ความเป็นส่วนตัว 100%)**: ส่งเฉพาะ Metadata ที่ผ่านการกรอง (TODO counts, Git status, README preview) ไปยัง AI **ไม่เคยส่งโค้ดจริง, ไฟล์ `.env`, หรือความลับใดๆ ออกนอกเครื่อง**

---

## 🖥️ 3 มุมมองหลักในการทำงาน (3 Core Views)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               KEENOII PROJECT SENTINEL                                 │
├─────────────────────────┬──────────────────────────────┬───────────────────────────────┤
│ 📊 1. PORTFOLIO VIEW    │ 🏢 2. VIRTUAL OFFICE (2.5D)  │ 🧠 3. PROJECT COCKPIT         │
│    (Dashboard & Grid)   │    (Interactive Diorama)     │    (Memory & Decisions)       │
│                         │                              │                               │
│ • คะแนนสุขภาพ 0–100      │ • ผังสำนักงาน 2.5D Cyberpunk │ • บันทึกเป้าหมาย (Current Goal)│
│ • Next Action ด่วน      │ • สลับอาคาร (Multi-Building) │ • ติดตามคอขวด (Blocker Queue) │
│ • มอนิเตอร์ Live Host   │ • เปลี่ยนภาพพื้นหลัง (Themes)│ • ไทม์ไลน์ความจำ (Memory Log)  │
│ • ซ่อน/เปิด Sub-services│ • บรรจุพนักงานประจำโต๊ะทำงาน │ • บันทึกคำแนะนำ AI ลงความจำ  │
└─────────────────────────┴──────────────────────────────┴───────────────────────────────┘
```

### 1. 📊 Portfolio Dashboard (`http://localhost:3000`)
- **Morning Intelligence Briefing**: สรุปความเคลื่อนไหวรอบวันใน 10 วินาที พร้อม 3 โปรเจกต์ที่ควรโฟกัสก่อน
- **Dual Metric Progress & Health**: แยกความคืบหน้า Roadmap (%) และคะแนนสุขภาพโค้ด (0-100 pts) ออกจากกันอย่างชัดเจน
- **Live URL Monitoring**: ตรวจสอบสถานะออนไลน์ (HTTP/HTTPS Response Time & Uptime) ของโปรเจกต์จริง
- **Sub-Service & Microservice Manager**: ซ่อนหรือปิดการใช้งาน Sub-services (`backend`, `frontend`, `src`) หรือปิดโหมด Multi-Service ให้กลายเป็นโปรเจกต์เดี่ยวได้อิสระ
- **Attention Queue**: แจ้งเตือนโปรเจกต์ที่ไม่มีการ Commit เกิน 14–90 วัน (Smart Stale), โปรเจกต์ที่ติดบล็อก หรือโค้ดที่มีความเสี่ยง

### 2. 🏢 2.5D Virtual Office Diorama (`http://localhost:3000/office`)
- **Multi-Building Management**: สลับและสร้างอาคารทำงานใหม่ได้ไม่จำกัด (เช่น *อาคาร 1: Command Center*, *อาคาร 2: Innovation Lab*)
- **Background Themes Gallery**: สลับภาพพื้นหลังห้องทำงานได้ใน 1 คลิก มีทั้งพรีเซ็ต Cyberpunk, Neon Lab, Dark Minimalist หรือใส่รูปภาพของตนเอง
- **Desk Staff & Workers Management**: บรรจุพนักงาน/บอทลงประจำแต่ละโต๊ะทำงาน (ระบุ Role, เลือก Avatar Emoji, ผูกกับโปรเจกต์ที่รับผิดชอบ)
- **Dual Persona Mode**: สลับมุมมองระหว่าง **`[📦 โปรเจกต์]`** (บอททำงานตามสุขภาพโค้ด) และ **`[👥 พนักงาน]`** (แสดงทีมงานที่นั่งประจำโต๊ะ)
- **Interactive Wall HUD Panels**: จอโฮโลแกรมลอยตัวแสดงสถานะโค้ด, Health Beads (🟢/🟡/🔴), และปุ่มเจาะลึก
- **Automated Office Tour**: ทัวร์สำนักงานอัตโนมัติพร้อมคำบรรยาย

### 3. 🧠 Project Memory & Cockpit (`http://localhost:3000/projects/[slug]`)
- **Goal & Blocker Box**: บันทึกเป้าหมายงานปัจจุบันและคอขวดที่กำลังเจอ พร้อมกำหนดวันติดตามงาน (Follow-up Date)
- **Project Memory Timeline**: บันทึกประวัติการตัดสินใจ (Decisions), ความสำเร็จ (Milestones), และโน้ตสำคัญ
- **AI Advisor Action Checkboxes**: ติ๊กเลือกคำแนะนำของ AI และกด **`[💾 บันทึกลงความทรงจำ]`** ได้ทันทีโดยไม่ต้องพิมพ์ซ้ำ

---

## 🚀 เริ่มต้นใช้งาน (Quick Start Guide)

### 📋 สิ่งที่ต้องมีในเครื่อง (Prerequisites)
- **Node.js** เวอร์ชัน **>= 22.0.0** (แนะนำ LTS ล่าสุด เพื่อใช้งาน Native `node:sqlite`)
- ระบบปฏิบัติการ: **Windows**, **macOS**, หรือ **Linux**

### 📦 ขั้นตอนการติดตั้งและรัน (3 คำสั่งเท่านั้น)
```bash
# 1. Clone โปรเจกต์ลงเครื่อง
git clone https://github.com/keenoii/keenoii-mornitoring.git

# 2. เข้าสู่โฟลเดอร์และติดตั้ง Dependencies
cd keenoii-mornitoring
npm install

# 3. เริ่มรัน Development Server
npm run dev
```

เปิดเว็บเบราว์เซอร์ไปที่:
- **📊 Portfolio View:** [http://localhost:3000](http://localhost:3000)
- **🏢 Virtual Office:** [http://localhost:3000/office](http://localhost:3000/office)

---

## 📁 การตั้งค่าโฟลเดอร์ที่จะสแกน (Workspace Setup)

เมื่อเปิดใช้งานครั้งแรก ระบบจะค้นหาโฟลเดอร์ใน `D:\MyProject` อัตโนมัติ หากโปรเจกต์ของคุณอยู่โฟลเดอร์อื่น สามารถตั้งค่าได้ง่ายๆ ดังนี้:

1. คลิกปุ่ม **`[+ เพิ่ม / จัดการโฟลเดอร์]`** ที่แถบเมนูด้านบน
2. พิมพ์ **ชื่อโฟลเดอร์** และ **Path บนเครื่อง** (เช่น `C:\Users\User\Projects` หรือ `D:\Work`)
3. กด **`บันทึกโฟลเดอร์`** ระบบจะสแกนและจัดทำดัชนีโปรเจกต์ทั้งหมดให้ทันที

---

## 🤖 การตั้งค่า AI Advisor (Typhoon, Gemini, Ollama)

คุณสามารถเลือกใช้โมเดล AI ได้ 4 รูปแบบ:
1. **🇹🇭 Typhoon v2.5 (30B Agentic)**: โมเดลภาษาไทยชั้นนำจาก SCB 10X (แนะนำสำหรับการวิเคราะห์ภาษาไทย)
2. **💻 Local Ollama (Offline 100%)**: รันโมเดลบนเครื่องของคุณเอง (เช่น `qwen2.5-coder` หรือ `llama3.2`) ที่ `http://localhost:11434`
3. **🌐 Google Gemini**: วิเคราะห์ผ่าน Gemini API (`gemini-1.5-flash`)
4. **📐 Deterministic Rule Engine**: วิเคราะห์ด้วยสูตรคณิตศาสตร์แบบ Offline 100% โดยไม่ต้องใช้ API Key

*การใส่ API Key:* กดปุ่ม AI ที่การ์ดโปรเจกต์ -> กดไอคอนกุญแจ `🔑` -> วาง API Key ของคุณ (ระบบจะบันทึกใน LocalStorage เครื่องของคุณเท่านั้น)

---

## 📊 สูตรการคำนวณคะแนนสุขภาพโค้ด (100-Point Health Score)

| มิติการประเมิน | คะแนนเต็ม | เกณฑ์การวัดผล |
| :--- | :---: | :--- |
| **Git Activity** | 15 | สถานะ Branch, Uncommitted Files, และความถี่ในการ Commit |
| **Documentation & Readme** | 10 | คุณภาพของไฟล์ `README.md`, สเปก และแนวทางการติดตั้ง |
| **Build Status** | 20 | ความสมบูรณ์ของ Manifest (`package.json`, `composer.json`, `go.mod`, `pom.xml`) |
| **Tests & QA** | 20 | การมีชุดทดสอบ Unit Tests (`jest`, `vitest`, `playwright`, `pytest`) |
| **Deployment & Containers** | 15 | มี Dockerfile, docker-compose.yml หรือ Kubernetes Manifests |
| **Code Debt & Open Tasks** | 10 | ปริมาณและความหนาแน่นของคอมเมนต์ `TODO`, `FIXME`, `BUG`, `HACK` |
| **Project Freshness** | 10 | การตรวจจับการทิ้งร้างอย่างชาญฉลาด (Smart Stale Calculation) |

---

## ⚙️ ไฟล์คอนฟิกเสริม `.project-monitor.yaml` (Optional)

คุณสามารถวางไฟล์ `.project-monitor.yaml` ไว้ที่โฟลเดอร์ Root ของโปรเจกต์ใดๆ เพื่อกำหนดค่าแบบกำหนดเองได้:

```yaml
name: My Super App
description: ระบบจัดการคำสั่งซื้อแบบเรียลไทม์
stage: Production # Planning, Development, Testing, Production, Maintenance
status: ACTIVE    # ACTIVE, BLOCKED, STALE, COMPLETED, ARCHIVED
progress: 85
health_url: https://my-app.example.com/api/health

milestones:
  - name: Setup Architecture & DB
    status: done
  - name: API Integration
    status: done
  - name: Payment Gateway
    status: doing
```

---

## 🛠️ โครงสร้างไฟล์ในโปรเจกต์ (Project Structure)

```
keenoii-mornitoring/
├── data/
│   └── sentinel.db                 # ฐานข้อมูล Native SQLite (Auto-generated)
├── public/
│   └── room/room-office.png        # ภาพพื้นหลัง 2.5D Diorama
├── src/
│   ├── app/
│   │   ├── page.tsx                # Portfolio Dashboard View
│   │   ├── office/page.tsx         # Cyberpunk 2.5D Virtual Office
│   │   ├── projects/[slug]/page.tsx# Project Memory & Cockpit
│   │   └── api/                    # Next.js API Routes (Scan, Memory, Advisor)
│   ├── collector/                  # Local Project Scanner & Git Parsers
│   ├── components/
│   │   ├── dashboard/              # Portfolio Grid & Modal Components
│   │   └── virtual-office/         # Diorama, Buildings, Staff & Canvas Controls
│   ├── config/                     # Navigation & App Settings
│   └── lib/                        # Rule Engine, SQLite Repository & AI Providers
└── package.json
```

---

## 📄 ใบอนุญาต (License)

พัฒนาโดย **KEENOII** เพื่อการบริหารจัดการพอร์ตโฟลิโอซอฟต์แวร์ระดับมืออาชีพ ภายใต้ [MIT License](LICENSE)
