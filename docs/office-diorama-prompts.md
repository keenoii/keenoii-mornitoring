# 🎨 Office Diorama AI Image Generation Guide & Master Prompts

คู่มือและชุด Prompt มาตรฐานสำหรับใช้สร้างภาพพื้นหลัง **2.5D Isometric Virtual Office Diorama** ด้วย AI Image Generators (เช่น **Midjourney v6**, **Flux.1 [dev/pro]**, **DALL-E 3**, **Stable Diffusion XL**) เมื่อต้องการปรับผังห้อง, เพิ่มห้องใหม่, หรือเปลี่ยนตำแหน่งโต๊ะทำงานในอนาคต

---

## 📐 1. Technical Specs & Design Guidelines

- **Aspect Ratio**: `16:9` (`--ar 16:9` หรือ `1920x1080` / `2560x1440`)
- **Camera Perspective**: `Orthographic 2.5D Isometric Cutaway Diorama`, High Angle (Bird's Eye / Tilt-Shift View).
- **Aesthetic Theme**: `Cyberpunk Command Center`, Dark Navy Blue Matte Metallic Floors, Glow Neon Trims (Red for War Room, Sky-Blue for Web, Neon Purple for AI, Cyan for NOC, Warm Amber for Lounge).
- **Character Style**: Miniature 3D Chibi / Stylized Claymation Developer Workers seated behind glowing multi-monitors, and sleeping peacefully with floating Zzz on lounge sofas.
- **Clean Background Rule**: ให้ AI วาดเฉพาะ **ห้อง ผนัง โต๊ะ เก้าอี้ จอคอมพิวเตอร์ และแสงไฟ** โดย **ไม่มีตัวหนังสือหรือข้อความโปรเจกต์** เพื่อให้ระบบ Next.js นำไปทำเป็น Dynamic Interactive HUD Layer ทับได้พอดี

---

## 🪄 2. Master Generation Prompts

### 🌟 Prompt A: Master Full Office Diorama (แบบ 4 โซนหลัก + War Room + Lounge)

> **ใช้สำหรับสร้างภาพผังรวม 4 โซนเหมือนปัจจุบัน**

```text
High-detail 2.5D isometric cutaway diorama of a futuristic cyberpunk AI developer office command center, tilt-shift miniature view, 16:9 widescreen layout.

Multi-level floor plan:
1. Top Level (Center): Emergency WAR ROOM with dark metallic walls, glowing red neon ambient strips, 3 developer desks with curved multi-monitors, red warning indicators.
2. Middle Level Left: WEB DEVELOPMENT STUDIO with sleek cyan-blue neon trims, 3 developer desks with dual monitors, glowing code screens, miniature potted plants.
3. Middle Level Center: AI & AUTOMATION LAB with futuristic purple-magenta neon lighting, 3 high-tech developer desks, robotic mechanical arms, neural network grid wall displays.
4. Middle Level Right: NETWORK & INFRASTRUCTURE NOC with glowing cyan LED server racks, 2 operator desks, futuristic Kubernetes server tower with pulsing blue cooling lights.
5. Bottom Level: ARCHIVE & DORMANT LOUNGE with cozy dark grey leather armchairs, warm dimmed ambient lamps, miniature cute chibi developers sleeping comfortably on sofas with subtle floating Zzz effects.

Cinematic octane render, Unreal Engine 5 aesthetic, volumetric neon lighting, clean walls ready for UI overlay, dark moody cyberpunk atmosphere, ultra-sharp 8k resolution, no watermark, no text on walls --ar 16:9 --v 6.0 --style raw
```

---

### 🌟 Prompt B: Expanded 8-Studio Mega Office (มี Data Room, Media Lab, POC Lab)

> **ใช้สำหรับสร้างผังออฟฟิศขนาดใหญ่ ครบทั้ง 8 สตูดิโอ**

```text
Detailed 2.5D isometric cutaway diorama of a sprawling futuristic technology headquarters, miniature tilt-shift architecture, 16:9 widescreen.

Arranged in multi-tier isometric pods:
- Tier 1 (Apex): Glowing Red War Room with 3 emergency multi-screen command desks.
- Tier 2 (Left): Sky-Blue Web Studio (3 desks).
- Tier 2 (Center): Neon Purple AI Agent Robotics Lab (3 desks with mechanical arms).
- Tier 2 (Right): Cyan Infrastructure NOC with server rack towers.
- Tier 3 (Left): Amber Data & SQL Room with glowing holographic storage cubes.
- Tier 3 (Center): Pink-Magenta Creative Media Lab with video screens and broadcast lights.
- Tier 3 (Right): Emerald-Green POC & Experimental Sandbox Lab with glowing beaker prototype stations.
- Tier 4 (Base): Warm cozy Dormant Lounge with black leather armchairs and sleeping miniature developers.

Clean high-end 3D render, dark metallic panels, ray-traced neon lighting, pristine composition, perfectly balanced, no text, no captions --ar 16:9 --v 6.0
```

---

## 🛠️ 3. วิธีนำภาพใหม่มาใส่ในระบบ Sentinel

เมื่อคุณสร้างภาพเสร็จแล้ว (เช่น ได้ไฟล์ภาพใหม่มา):

1. **วางไฟล์ภาพลงในโฟลเดอร์**:
   ```
   d:/MyProject/keenoii-mornitoring/public/room/my-new-office.png
   ```

2. **เปิดไฟล์กำหนดพิกัด**:
   `src/lib/office-layout-config.ts`

3. **แก้ไขพิกัดเปอร์เซ็นต์ (`top`, `left`) ให้ตรงกับตำแหน่งโต๊ะในภาพใหม่**:
   ```typescript
   export const DEFAULT_OFFICE_LAYOUT: OfficeLayoutTheme = {
     imageSrc: '/room/my-new-office.png',
     panels: {
       warroom: [
         { id: 'war-1', top: '15.5%', left: '38.2%', width: '115px', roomType: 'warroom' },
         // ปรับพิกัดตามตำแหน่งโต๊ะจริงในภาพ
       ],
       // ...
     }
   };
   ```

4. ระบบจะทำการ **Render การ์ดข้อมูลจริงลอยทับบนภาพใหม่อัตโนมัติทันที** โดยไม่ต้องเขียนโค้ดระบบใหม่อีกเลยครับ! 🚀
