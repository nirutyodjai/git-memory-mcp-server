import { Building2, Shield, Network, Zap, Cable, Users, Award, Clock } from "lucide-react";

export const comdeeCompanyInfo = {
  name: "COMDEE",
  fullName: "COMDEE - Complete Systems Solution",
  description: "ผู้เชี่ยวชาญด้านการติดตั้งและบริการระบบต่างๆ ครบวงจร",
  tagline: "ผู้เชี่ยวชาญระบบ CCTV และเครือข่าย ครบวงจรด้านไฟฟ้าและ Fiber Optic",
  website: "https://comdee.co.th",
  logo: "/logo-new.svg",
  
  // Company Statistics
  stats: [
    {
      icon: Shield,
      count: 800,
      label: "โครงการ CCTV",
      color: "text-blue-600"
    },
    {
      icon: Clock,
      count: 15,
      label: "ปี ประสบการณ์",
      color: "text-green-600"
    },
    {
      icon: Users,
      count: 500,
      label: "ลูกค้าที่ไว้วางใจ",
      color: "text-purple-600"
    },
    {
      icon: Award,
      count: 100,
      label: "โครงการสำเร็จ",
      color: "text-orange-600"
    }
  ],

  // Main Services
  services: [
    {
      id: "cctv",
      title: "ระบบ CCTV กล้องวงจรปิด",
      description: "ติดตั้งและบริการระบบกล้องวงจรปิด IP Camera ระบบรักษาความปลอดภัย",
      icon: Shield,
      features: [
        "กล้อง IP Camera คุณภาพสูง",
        "ระบบบันทึกภาพ NVR/DVR",
        "การเชื่อมต่อผ่านเครือข่าย",
        "ระบบแจ้งเตือนอัตโนมัติ",
        "การดูภาพผ่านมือถือ"
      ]
    },
    {
      id: "network",
      title: "ระบบเครือข่าย LAN/WAN/WiFi",
      description: "ออกแบบและติดตั้งระบบเครือข่ายคอมพิวเตอร์ LAN WAN WiFi",
      icon: Network,
      features: [
        "ระบบเครือข่าย LAN/WAN",
        "WiFi Access Point",
        "Network Switch & Router",
        "Firewall Security",
        "Network Monitoring"
      ]
    },
    {
      id: "electrical",
      title: "ระบบไฟฟ้า UPS สำรองไฟ",
      description: "ติดตั้งระบบไฟฟ้า ระบบสำรองไฟ UPS และระบบจ่ายไฟ",
      icon: Zap,
      features: [
        "ระบบไฟฟ้าอาคาร",
        "UPS ระบบสำรองไฟ",
        "ระบบจ่ายไฟ DC",
        "ระบบกราวด์",
        "ระบบป้องกันฟ้าผ่า"
      ]
    },
    {
      id: "fiber",
      title: "Fiber Optic OTDR Testing",
      description: "ติดตั้งและทดสอบสายใยแก้วนำแสง Fiber Optic OTDR Testing",
      icon: Cable,
      features: [
        "สายใยแก้วนำแสง Fiber Optic",
        "OTDR Testing & Certification",
        "Fiber Splicing",
        "Fiber Termination",
        "Network Infrastructure"
      ]
    }
  ],

  // Contact Information
  contact: {
    phone: "+66-2-555-0123",
    address: {
      street: "29 ซอย คู้บอน 6",
      district: "รามอินทรา",
      province: "กรุงเทพมหานคร",
      postalCode: "10230",
      country: "ประเทศไทย"
    },
    social: {
      facebook: "https://facebook.com/comdee",
      line: "https://line.me/@comdee"
    }
  },

  // Company Highlights
  highlights: [
    "ประสบการณ์กว่า 15 ปี",
    "ทีมช่างมืออาชีพ",
    "อุปกรณ์คุณภาพสูง",
    "บริการครบวงจร",
    "รับประกันคุณภาพ",
    "บริการหลังการขาย"
  ],

  // Keywords for SEO
  keywords: [
    "CCTV",
    "กล้องวงจรปิด",
    "ระบบเครือข่าย",
    "ระบบไฟฟ้า",
    "Fiber Optic",
    "IP Camera",
    "Network Installation",
    "ติดตั้งกล้องวงจรปิด",
    "ระบบรักษาความปลอดภัย",
    "LAN",
    "WAN",
    "WiFi",
    "UPS",
    "ระบบสำรองไฟ",
    "COMDEE"
  ]
};

export default comdeeCompanyInfo;