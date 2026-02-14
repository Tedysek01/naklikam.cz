import { Facebook, Instagram } from 'lucide-react'

export function SocialMediaIcons({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <a 
        href="https://www.facebook.com/profile.php?id=61578728322073" 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Facebook"
      >
        <Facebook size={20} />
      </a>
      <a 
        href="https://www.instagram.com/naklikam" 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Instagram"
      >
        <Instagram size={20} />
      </a>
      <a 
        href="https://www.tiktok.com/@naklikam?lang=cs-CZ" 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-muted-foreground hover:text-foreground transition-colors"
        aria-label="TikTok"
      >
        <svg 
          viewBox="0 0 24 24" 
          width="20" 
          height="20" 
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M19.321 5.562a5.122 5.122 0 0 1-.443-.258 6.228 6.228 0 0 1-1.138-1.009 6.268 6.268 0 0 1-1.362-2.472 6.068 6.068 0 0 1-.233-1.12h.018c-.035-.198-.051-.396-.053-.598H12.8v12.757c0 .17 0 .337-.006.503-.006.13-.018.258-.035.385a2.254 2.254 0 0 1-2.24 1.935 2.211 2.211 0 0 1-1.302-.421A2.254 2.254 0 0 1 8.287 13c0-.551.195-1.053.524-1.446a2.211 2.211 0 0 1 1.708-.8c.12 0 .237.01.353.028V7.435a5.6 5.6 0 0 0-.353-.011 5.542 5.542 0 0 0-4.14 1.857A5.596 5.596 0 0 0 4.88 13.5a5.604 5.604 0 0 0 3.912 5.343c.396.115.81.174 1.228.174a5.543 5.543 0 0 0 3.914-1.614 5.591 5.591 0 0 0 1.655-3.753l-.016-7.58a9.127 9.127 0 0 0 1.948 1.179 9.04 9.04 0 0 0 2.479.56V4.618a5.759 5.759 0 0 1-1.679.943Z"/>
        </svg>
      </a>
    </div>
  )
}