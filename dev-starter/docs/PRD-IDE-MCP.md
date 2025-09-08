# Product Requirements Document (PRD)
# IDE ที่เชื่อมต่อ GitMemory และรองรับ MCP จำนวนมาก

## ภาพรวมและวัตถุประสงค์

### วัตถุประสงค์
สร้าง/ปรับแต่ง IDE ให้:
- เชื่อมต่อ MCP ได้ในสเกลสูง (เป้าหมาย registry 1500 ตัว) ด้วยการบริหารจัดการที่มีประสิทธิภาพ
- ให้คุณภาพคำตอบสูง รวดเร็ว และเสถียร ด้วยการแบ่งบทบาท AI ตามความสามารถ
- มี AI วิเคราะห์โค้ดอย่างต่อเนื่อง รวบรวมโค้ด/คำสั่งที่ใช้บ่อยให้เป็น "ปุ่มลัด"
- จัดทำ "สมุดรวมฟังก์ชัน" (Function Notebook/Playbook) ให้เป็นต้นแบบที่เอไอตัวอื่นๆ อ้างอิงเพื่อลดเวลา
- เมื่อโค้ดเสีย ให้มี AI ผู้รับผิดชอบทำ Auto-Fix พร้อมหลักฐาน/เทสต์

### กลุ่มผู้ใช้
- นักพัฒนา
- ทีม AI
- โอเปอเรชันส์
- Tech lead

### ความสำเร็จ (KPI)
- P50 ใช้เวลาเรียกใช้เครื่องมือ/คำตอบ < 1.5 วินาที, P95 < 3 วินาที (ต่อคำสั่ง/การคุยทั่วไป)
- อัตราแนะนำที่ถูกยอมรับโดยผู้ใช้ (Suggestion Acceptance Rate) > 35%
- อัตรา Auto-Fix สำเร็จโดยไม่ย้อนกลับ > 80% บนปัญหาที่ตรวจจับอัตโนมัติ
- Throughput รองรับ active tools ได้ 100–300 พร้อมกันต่อ workspace และ scalable ถึง 1500 ในระดับ registry (pooling)

## ขอบเขต

### ในขอบเขต
- Orchestrator หลายเอเจนต์ (MCP-based) ด้วยการจัดสรรงานตาม capability
- ระบบ Code Intelligence: static + lightweight dynamic signals
- Snippet Miner: คัดคำ/โค้ดที่ใช้บ่อย สร้างเป็น "ปุ่ม"
- Function Notebook/Playbook: จัดองค์ความรู้แบบใช้งานได้ซ้ำ โดยเอไอตัวอื่นอ้างอิงทันที
- Auto-Fix Pipeline: ตรวจจับ-สร้างแพตช์-รันทดสอบ-เปิด PR/commit พร้อมรีพอร์ต
- UI ภายใน IDE สำหรับ: แผงควบคุมเอเจนต์, ปุ่มลัด (Snippet Bar), หน้า Function Notebook, Log/Trace, Override

### นอกขอบเขต (ระยะนี้)
- รุ่น LLM ใหม่
- ระบบดีพลอยโปรดักชัน CI/CD นอก IDE

## สถาปัตยกรรมระดับสูง

### ชั้น Extension/IDE
- VS Code Extension (TypeScript) เป็น frontend interaction และ command surface
- แผงควบคุม AI/Tools, ปุ่มลัด, Function Notebook, Log/Trace

### ชั้น Orchestrator (Node/TS)
- Agent Registry/Pool Manager: ลงทะเบียน 1500 MCP tools/agents แบบ lazy-load/connection pooling
- Task Router: จับคู่คำสั่งกับเอเจนต์ตาม capability, latency, และคุณภาพที่คาดการณ์
- Rate Limiter/QoS: ป้องกัน overload ต่อเครื่องมือ/โฮสต์
- Telemetry/Scoring: วัดคุณภาพคำตอบ, ความเร็ว, success/failure

### ชั้น Code Intelligence
- Static Analyzer: AST, LSP, dependency graph, hotspots
- Snippet Miner: นับความถี่ + tf-idf + pattern mining เพื่อสร้างปุ่มลัดแบบ context-aware
- Pattern Library (Function Notebook): อัปเดตและจัดเวอร์ชันสำหรับให้เอไออื่นอ้างอิง

### ชั้น Auto-Fix
- Detector: lint/tests/runtime logs hook
- Fixer: สร้าง patch + test augmentation
- Verifier: รันทดสอบ/กฎความปลอดภัย
- Committer: เปิด PR/commit พร้อมรีพอร์ต

### Integrations
- GitMemory: แหล่งความรู้โค้ด/ประวัติ/ตัวอย่าง ใช้เป็นฐานเพิ่มคุณภาพคำตอบ
- MCP: คลังเครื่องมือ/เอเจนต์ที่เข้าถึงได้ผ่านโปรโตคอล MCP

## การเชื่อมกับโค้ดปัจจุบัน

### โครงร่างไฟล์สำคัญ
- แกนส่วนขยายและเครื่องมือ:
  - `index.ts`
  - `toolHandler.ts`
  - `vscodeTool.ts`
  - `fileTools.ts`
  - `pathValidation.ts`
  - `server.py`

### หมายเหตุ
จะเพิ่มชั้น Orchestrator/CodeIntel/Auto-Fix ภายใต้ src/ โดยยึดสไตล์และยูทิลิตีที่มีอยู่

## บทบาท AI และการแบ่งหน้าที่

### ตัวอย่างคลัสเตอร์
- **Code Analyst**: วิเคราะห์โค้ด/สถาปัตยกรรม, ชี้ประเด็น, หา duplication/hotspot
- **Pattern Curator**: สกัด template/snippet, บริหาร Function Notebook
- **Refactorer**: รีแฟกเตอร์, จัดรูปแบบ, ควบคุมผลกระทบ
- **Test Engineer**: สร้าง/ปรับเทสต์, ตรวจความครอบคลุม
- **Runtime Doctor**: เฝ้าดู error/log/test failures, เปิดเคสให้ Auto-Fix
- **Auto-Fixer**: สร้างแพตช์, อัปเดตเทสต์, ส่งให้ Verifier
- **Verifier/Guardian**: รันทดสอบ, policy, security gate
- **Knowledge Librarian**: ซิงค์ GitMemory, จัดเอกสาร/ตัวอย่าง

## ฟีเจอร์หลัก

### 1. MCP Orchestration (1500 registry scale)
- ลงทะเบียนเอเจนต์แบบ metadata-first (ไม่เปิด connection ทั้งหมด)
- Health/Latency probing แบบ adaptive
- Prioritized scheduling + admission control
- Capability tags + historical scoring ช่วย routing
- แคชผลลัพธ์และเดดุปคำขอซ้ำ

### 2. Code Intelligence + Snippet Miner
- ทำดัชนีโค้ดและความถี่การใช้งานจริงในโปรเจกต์
- แปลง snippets/คำสั่งที่ใช้บ่อยเป็น "ปุ่มลัด" แบบ context-aware (เช่น เปลี่ยน refactor pattern ให้ตรงไฟล์/ภาษานั้น)
- ปุ่มลัดมี preview และสวิตช์ parameter อย่างรวดเร็ว

### 3. Function Notebook/Playbook (สำหรับ AI ตัวอื่นใช้งานตาม)
- โครงสร้าง: ชื่อแพทเทิร์น, คำอธิบาย, ขั้นตอน, ข้อจำกัด, ตัวอย่างโค้ด, ตัววัดความสำเร็จ
- Versioned + approval flow
- สร้าง/อัปเดตอัตโนมัติจากการใช้งานจริง + curated โดยมนุษย์หรือเอไอบางบทบาท

### 4. Auto-Fix Pipeline
- Trigger: จาก lint/test/runtime error
- Patch proposal -> Test augmentation -> Verify -> Commit/PR
- Policy: ต้องผ่านตรวจสิทธิ์, path whitelisting, secret guard
- Rollback plan และ annotate ใน PR

### 5. UI/UX ภายใน IDE
- Agent Dashboard: สถานะ/latency/คุณภาพ/สวิทช์เปิดปิด
- Snippet Bar: ปุ่มลัดแนะนำตาม context พร้อม search
- Function Notebook View: ค้นหา/เรียกใช้แพทเทิร์น/ดู diff ก่อนใช้
- Fix Center: คิวปัญหา/patch preview/run tests/logs
- Logs/Trace: ติดตามการตัดสินใจของ Orchestrator และเหตุผลเลือกเอเจนต์

## ข้อกำหนดสมรรถนะและความเสถียร

- Latency targets: P50 < 1.5s, P95 < 3s ต่อคำขอเครื่องมือที่ cacheable
- Concurrency: รองรับ active tools 100–300 พร้อมกัน; registry ขนาด 1500 ผ่าน lazy init
- Resource control: connection pooling, backpressure, circuit breaker
- Caching: content-addressable + TTL แบบตามชนิดงาน
- Fallback: เสนอคำตอบ degrade ที่ยังมีประโยชน์เมื่อบางเอเจนต์ล่ม

## ความปลอดภัยและสิทธิ์

- Path allowlist/denylist ในการแก้ไฟล์อัตโนมัติ
- Secret scrubber ใน log/patch/PR
- Permission boundary: ต้องได้รับยืนยันสำหรับการแก้ส่วนสำคัญ (config/infra)
- Audit trail: ทุก autopatch มี log, diff, test result, approver

## Workflow สำคัญ

- **Developer-driven**: ผู้ใช้คลิกปุ่มลัด/เรียกใช้แพทเทิร์น → Orchestrator route → แสดง preview → Apply
- **Continuous Mining**: Snippet Miner สแกนเหตุการณ์แก้ไข/รันคำสั่ง สร้างปุ่มลัดใหม่
- **Auto-Fix**: Detector→Fixer→Verifier→Commit/PR พร้อมรีพอร์ตและ tag owner
- **Knowledge Sync**: Librarian sync กับ GitMemory เป็นระยะและแบบ on-demand

## Data Model/Schema (สรุป)

- **AgentMetadata**: id, capabilities[], health, latency stats, success score
- **Task**: type, context, required_caps[], priority, deadline
- **Snippet**: id, language, template, params, frequency, quality score
- **Pattern (Notebook)**: id, version, steps[], examples, constraints, metrics
- **Incident**: source(lint/test/runtime), evidence, patch, test results, status

## API/Events (ภายใน)

### Orchestrator
- POST /routeTask, GET /agents, POST /agents/reload
- Events: agent.health, task.completed, task.failed, cache.hit

### CodeIntel
- POST /mineSnippets, GET /snippets?context=…, GET /patterns, POST /patterns

### AutoFix
- POST /incident, GET /incidents/:id, POST /patch/verify, POST /commit

### IDE Commands (VS Code)
- cmd.openSnippetBar, cmd.applyPattern, cmd.openFixCenter, cmd.toggleAgent

## แผนการพัฒนา

### ระยะที่ 1 (MVP – 3–4 สัปดาห์)
- Orchestrator + Agent Registry (lazy load, basic routing)
- Snippet Bar (read-only) + Mining ขั้นต้น
- Function Notebook แบบพื้นฐาน (ค้นหา/เรียกใช้)
- Detector (lint/test) → Manual approve fix, basic verify
- Telemetry เบื้องต้น
- **Acceptance**: Routing เสถียร, ปุ่มลัดใช้งานได้จริง, Notebook เรียกใช้ได้

### ระยะที่ 2 (Quality & Speed – 4–6 สัปดาห์)
- Advanced routing (latency-aware + quality score)
- Snippet Bar แบบ context-aware + A/B suggestion
- Auto-Fix กึ่งอัตโนมัติ + test augmentation
- Security hardening (secret guard, path policy)
- **Acceptance**: P50 < 1.5s, Auto-Fix success > 70%

### ระยะที่ 3 (Scale & Autonomy – 4–8 สัปดาห์)
- ขยาย registry ถึง 1500 ด้วย pooling/circuit breaker ครบ
- Full Auto-Fix (no-touch สำหรับ low-risk), rollback plan
- Knowledge sync กับ GitMemory อัตโนมัติ + ranking
- **Acceptance**: รองรับ 1500 registry, Auto-Fix > 80%, stability สูง

## ความเสี่ยงและการบรรเทา

- **การจัดการ 1500 MCP**: ใช้ lazy discovery, connection pooling, partial hydration
- **คุณภาพคำตอบ**: คะแนนสะสมต่อเอเจนต์ + feedback loop + offline evaluation
- **ความช้าจาก IO**: parallelism คุมด้วย QoS + caching แยกตามชนิดงาน
- **Auto-Fix misfire**: policy gate, test-first, staged rollout, quick rollback

## เทเลเมทรีและเมตริก

- Suggestion Acceptance Rate, Auto-Fix Success, Mean Time To Repair
- Latency per capability, Cache hit rate, Agent health/availability
- Notebook reuse rate, Snippet click-through

## การทดสอบ/เกณฑ์ยอมรับ

- Routing correctness (mock agents), Load test (100–300 concurrency)
- Snippet relevance A/B, Pattern execution success
- Auto-Fix: end-to-end red→green บนเซ็ตเคสมาตรฐาน
- Security: secret leak tests, path policy enforcement

## การเชื่อมโยงกับโค้ดฐานปัจจุบันและงานที่จะเพิ่ม

เพิ่มโมดูล Orchestrator/CodeIntel/Auto-Fix ในโครงสร้างเดิม โดยอ้างอิงยูทิลิตีที่มี:
- Entry/registration: `index.ts`
- Tool wiring/dispatch: `toolHandler.ts`
- VS Code integration: `vscodeTool.ts`
- Security guard: `pathValidation.ts`
- Python side (หากใช้ร่วมเป็นภาคบริการ AI): `server.py`

---

**สถานะ**: เอกสารนี้พร้อมสำหรับการพัฒนา MVP ระยะที่ 1
**วันที่อัปเดต**: มกราคม 2025
**ผู้รับผิดชอบ**: Development Team