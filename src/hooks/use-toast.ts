import * as React from "react"

type ToastProps = {
  title: string
  description?: string
  variant?: "default" | "destructive"
}

// Simple toast implementation - could be replaced with more sophisticated solution
export function useToast() {
  const toast = React.useCallback(({ title, description, variant = "default" }: ToastProps) => {
    // For now, just log to console and show alert
    // In production, you'd integrate with a proper toast library
    console.log(`Toast [${variant}]: ${title}`, description);
    
    // Simple browser notification as fallback
    if (variant === "destructive") {
      alert(`Error: ${title}\n${description || ""}`);
    } else {
      // Create a simple toast notification
      const toastEl = document.createElement('div');
      const colorClass = "bg-green-500 text-white";
      toastEl.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${colorClass}`;
      toastEl.innerHTML = `
        <div class="font-medium">${title}</div>
        ${description ? `<div class="text-sm opacity-90">${description}</div>` : ""}
      `;
      
      document.body.appendChild(toastEl);
      
      // Auto remove after 3 seconds
      setTimeout(() => {
        toastEl.style.opacity = '0';
        toastEl.style.transform = 'translateX(100%)';
        setTimeout(() => {
          document.body.removeChild(toastEl);
        }, 300);
      }, 3000);
    }
  }, []);

  return { toast };
}