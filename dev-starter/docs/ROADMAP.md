# ROADMAP — Git Memory MCP Server
ปรับปรุงล่าสุด: 2025-09-05

สัญลักษณ์สถานะ:
- [ ] ยังไม่เริ่ม
- [x] เสร็จแล้ว
- [ ] (กำลังทำ) ใส่หมายเหตุท้ายงาน เช่น “กำลังพัฒนา”

อ้างอิง:
- แผนภาพรวม: docs/README.md ส่วน “Upgrade Plan”
- รายงานไฟล์โค้ด: docs/js-categorization.md, docs/js-categorization.txt

------------------------------------------------------------

## ระยะที่ 1: Monetization Foundation (เดือน 1-3)

ผลลัพธ์ที่คาดหวัง (Outcomes)
- [ ] เปิดตัว Premium Dashboard (Analytics/Audit/RBAC) สำหรับโปรฯ/เอนเตอร์ไพรส์
- [ ] SaaS รุ่นแรก (Multi-tenant + Billing + Plans) พร้อมใช้งานจริง
- [ ] เปิด Marketplace รุ่น Alpha และรับซับมิทชันชุดแรก
- [ ] แตะรายได้ 10K MRR และลูกค้าแบบชำระเงิน 100 ราย

งานย่อย (Epics & Tasks)
- Productization & Packaging
  - [ ] จัดแพ็ก CLI/Server ข้ามแพลตฟอร์ม (Windows/macOS/Linux)
  - [ ] ออก Docker image + ตัวอย่าง docker-compose ใช้งานจริง
  - [ ] ตั้งเวอร์ชันนิ่ง/CHANGELOG/Release notes อัตโนมัติ
- SaaS MVP
  - [ ] Multi-tenant auth (Org/Project/User)
  - [ ] เชื่อม Billing (Stripe) + Subscription/Usage metering
  - [ ] แผนราคา (Free/Pro/Enterprise) และการจำกัดทรัพยากร
  - [ ] Admin portal (จัดการผู้ใช้, แผน, การชำระเงิน)
- Premium Features
  - [ ] Advanced Analytics Dashboard (real-time metrics, cost insight)
  - [ ] RBAC/SSO (OIDC/SAML ขั้นพื้นฐาน)
  - [ ] Audit log และ export/report
- Marketplace (Alpha)
  - [ ] นิยามสเปก metadata ของ MCP server (manifest, category, compat)
  - [ ] ขั้นตอนส่งขึ้น/รีวิว/อนุมัติ (submission workflow)
  - [ ] ระบบคะแนน/คุณภาพขั้นต้น และ curated list
- Docs & DX
  - [ ] ปรับ Quick Start/Guides ให้สั้น ตรงประเด็น พร้อมโค้ดตัวอย่าง
  - [ ] เติม API Reference ให้ครบถ้วน + ตัวอย่างเรียกใช้
  - [ ] ชุด Examples ครอบคลุมกลุ่ม Core/Creative/Web/DevTools
- Ops/Observability
  - [ ] Logging ที่เป็นมาตรฐาน (โครงสร้าง/ระดับ/Correlation Id)
  - [ ] Metrics + Dashboard (Prometheus/Grafana/Cloud)
  - [ ] นโยบาย Backup/Restore และคู่มือทดสอบ DR

หมุดหมาย (Milestones)
- [ ] เปิด Premium Dashboard
- [ ] SaaS รุ่นแรกออนไลน์
- [ ] Marketplace Alpha live
- [ ] 100 Paying Customers / 10K MRR

------------------------------------------------------------

## ระยะที่ 2: Ecosystem Expansion (เดือน 3-12)

ผลลัพธ์ที่คาดหวัง (Outcomes)
- [ ] เปิดตัว SDK หลายภาษา (TS/JS, Python, Go) GA
- [ ] API Gateway as a Service แบบจัดการเต็มรูปแบบ + Edge deployment
- [ ] ฟีเจอร์ AI สำหรับ Load Balancing/Scaling/Monitoring
- [ ] รายได้ 100K–500K MRR และลูกค้าเอนเตอร์ไพรส์ 1K–5K ราย

งานย่อย (Epics & Tasks)
- Developer Platform & SDKs
  - [ ] TS/JS SDK v1 + ตัวอย่าง/เอกสารครบถ้วน
  - [ ] Python SDK v1 + ตัวอย่าง/เอกสารครบถ้วน
  - [ ] Go SDK v1 + ตัวอย่าง/เอกสารครบถ้วน
  - [ ] Developer portal (Docs/Playground/Forum)
- API Gateway as a Service
  - [ ] Managed endpoints + autoscaling
  - [ ] Global edge (CDN/WAF) + caching
  - [ ] Analytics/Quota/Policy management
- AI-Powered Features
  - [ ] Intelligent load balancing (ML-based)
  - [ ] Predictive scaling (pattern-based)
  - [ ] Smart monitoring (anomaly/RCA/auto-remediation)
- Enterprise Solutions
  - [ ] โมดูล deploy multi-cloud (AWS/Azure/GCP)
  - [ ] เทมเพลตเน็ตเวิร์กปลอดภัย (VPC/VNet, PrivateLink)
  - [ ] Compliance packs baseline (SOC2/ISO27001)
- Marketplace (Growth)
  - [ ] ระบบแบ่งรายได้ + รายงาน/จ่ายเงินรายเดือน
  - [ ] การจัดหมวด/Badge คุณภาพ/คัดสรรเชิงบรรณาธิการ

หมุดหมาย (Milestones)
- [ ] SDKs (TS/JS, Python, Go) GA
- [ ] API Gateway as a Service เปิดทั่วไป
- [ ] AI features รุ่นแรกใช้งานจริง
- [ ] 100K MRR / 1K Enterprise Customers

------------------------------------------------------------

## ระยะที่ 3: Global Enterprise (เดือน 12-24)

ผลลัพธ์ที่คาดหวัง (Outcomes)
- [ ] ความพร้อมใช้งานระดับ 99.99% พร้อมกระบวนการ SRE ครบ
- [ ] ฟีเจอร์ความปลอดภัยขั้นสูง (DLP/KMS/Advanced RBAC)
- [ ] Listing บน Cloud Marketplace และพันธมิตร SI
- [ ] รายได้แตะ 500K MRR และลูกค้าองค์กรชั้นนำ

งานย่อย (Epics & Tasks)
- Compliance & Security
  - [ ] SSO/SAML/OIDC ครบถ้วน + SCIM
  - [ ] Advanced RBAC (resource-level, policy engine)
  - [ ] Data protection/DLP + Encryption with KMS
- Scale & Resilience
  - [ ] ชุดทดสอบสเกล 1,000+ servers (load/stress/chaos)
  - [ ] Orchestration auto-heal/auto-tune
  - [ ] แผน DR/BCP ระดับภูมิภาค (RTO/RPO ชัดเจน)
- Partnerships & GTM
  - [ ] Cloud marketplace listings (AWS/Azure/GCP)
  - [ ] พันธมิตร System Integrator/Consulting
- Sales/Support
  - [ ] SLA 99.99% พร้อมกระบวนการ incident/alert/runbook
  - [ ] 24/7 NOC/Follow-the-sun support

หมุดหมาย (Milestones)
- [ ] 500K MRR
- [ ] ลูกค้า Fortune 500 รายแรก
- [ ] 99.99% uptime ต่อเนื่อง 3 เดือน

------------------------------------------------------------

## แผน Sprint (ตัวอย่าง 8–12 สัปดาห์ แรก)
- สัปดาห์ 1–2
  - [ ] Docker images + Compose ตัวอย่าง
  - [ ] Logging/metrics พื้นฐาน + dashboard เริ่มต้น
  - [ ] Quick Start ฉบับสั้น + ตัวอย่างการใช้งานจริง
- สัปดาห์ 3–4
  - [ ] SaaS: Multi-tenant auth + Billing integration
  - [ ] Premium Dashboard (MVP)
- สัปดาห์ 5–6
  - [ ] RBAC/SSO (พื้นฐาน)
  - [ ] Audit log + Export
- สัปดาห์ 7–8
  - [ ] Marketplace Alpha (submission + review)
  - [ ] Examples ครบหมวด (Core/Web/DevTools)

หมายเหตุการติดตาม
- ใช้เช็คบ็อกซ์ในไฟล์นี้ร่วมกับบอร์ดงาน (เช่น GitHub Projects/Jira) ได้
- เมื่อเสร็จงาน ให้ติ๊ก [x] และ/หรืออ้างอิง PR/Commit ไว้ท้ายบรรทัด