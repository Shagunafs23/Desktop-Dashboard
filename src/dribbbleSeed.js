// Popular web-design shots captured from dribbble.com on 2026-09-08. Used until the server delivers a fresh list.
const CDN = "https://cdn.dribbble.com/userupload/";
const raw = [
  ["AI assistant orb animation", "27709415-AI-assistant-orb-animation", "48941424/file/still-557b4aaf17252199ba11f52c6d0273ef.png"],
  ["Home Services / Service Marketplace", "27708245-Home-Services-Service-Marketplace-Local-service-finder-web", "48937400/file/19fae8e9d4b74ef5f90238564220bb0a.jpg"],
  ["Art Gallery Website Design – Atelier Meridian", "27709467-Art-Gallery-Website-Design-Atelier-Meridian", "48941619/file/550d2d6668aeafd695a0dcc92318a4af.jpg"],
  ["Screen Recorder Website UI", "27710727-Screen-Recorder-Website-UI", "48945934/file/f0affe507e0d343939d0eab5254aaa42.png"],
  ["Safew – Smart Hydration Bottle Landing Page", "27656997-Safew-Smart-Hydration-Bottle-Landing-Page", "48747762/file/c70a0a3189b916de3e97c9893b4b88cb.png"],
  ["Smart Home Living Dashboard", "27708711-Smart-Home-Living-Dashboard", "48939064/file/48b2181763852c307381439680893f68.png"],
  ["Taoscan Landing Page — Blockchain Explorer UI", "27709296-Taoscan-Landing-Page-Bittensor-Blockchain-Explorer-UI", "48940983/file/2815ecf928d6dfc5e03bf34d34260fd7.jpg"],
  ["Product for a Healthcare App ✦ Reroot", "27710460-Product-for-a-Healthcare-App-Reroot", "48944913/file/61fb63606564447f9735236a82cb7eff.png"],
  ["Beauty Ecommerce - Retail Web Storefront", "27698033-Beauty-Ecommerce-Retail-Web-Storefront", "48899558/file/318b05197e943ed82d55f631fccded20.png"],
  ["Niva — AI Automation Agency Website Template", "27708844-Niva-AI-Automation-Agency-Website-Template-Framer", "48939452/file/still-1e26cc6d57017a51a392e5fa36b61c28.png"],
  ["Golf Coaching & Club Website Design", "27708551-Golf-Coaching-Club-Website-Design", "48938624/file/73ece17329cd7eed0968652e2bafa3b0.png"],
  ["Kalla - Brewer E-Commerce Landing Page", "27708409-Kalla-Brewer-E-Commerce-Landing-Page", "48938037/file/9988c08331c872520f215da5366ec3d9.png"],
];
export const DRIBBBLE_SEED = raw.map(([title, slug, img]) => ({
  title, url: `https://dribbble.com/shots/${slug}`, image: `${CDN}${img}?resize=800x600&vertical=center`,
}));
