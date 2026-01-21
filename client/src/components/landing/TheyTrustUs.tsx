"use client"

import { testimonialsData } from "@/utils/constants"
import { Card } from "@/components/ui/card"
import { Icons } from "@/components/ui/icons"
import ScrollFloat from "@/components/ui/scroll-float/scroll-float"

interface Testimonial {
  image: string
  name: string
  username: string
  text: string
  social: string
}

interface TestimonialsProps {
  testimonials?: Testimonial[]
  className?: string
  title?: string
  description?: string
}

export function TheyTrustUs({
  testimonials = testimonialsData,
  className="pb-20 pt-15",
  title="They Trust Us",
  description="Discover what our founders and supporters say about Mana Chain"
}: TestimonialsProps) {
  const openInNewTab = (url: string) => {
    window.open(url, "_blank")?.focus()
  }

  return (
    <div className={className}>
      <div className="flex flex-col items-center justify-center pt-5">
        <div className="flex flex-col gap-5 mb-8">
          <div className="text-center">
            <ScrollFloat
              animationDuration={1}
              ease="back.inOut(2)"
              scrollStart="center bottom+=50%"
              scrollEnd="bottom bottom-=40%"
              stagger={0.03}
              containerClassName="mb-4"
              textClassName="text-3xl md:text-5xl font-bold bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent"
            >
              {title}
            </ScrollFloat>
          </div>
          <p className="text-center text-muted-foreground">
            {description.split("<br />").map((line, i) => (
              <span key={i}>
                {line}
                {i !== description.split("<br />").length - 1 && <br />}
              </span>
            ))}
          </p>
        </div>
      </div>

      <div className="relative">
        <div className="flex justify-center items-center gap-5 flex-wrap px-2">
          {testimonials.slice(0, 3).map((testimonial, index) => (
              <Card
                key={index}
                className="w-80 h-64 p-5 relative bg-card border-border shrink-0 flex flex-col"
              >
                <div className="flex items-center mb-4">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    width={50}
                    height={50}
                    className="rounded-full object-cover shrink-0"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                  <div className="flex flex-col pl-4 min-w-0">
                    <span className="font-semibold text-base truncate">
                      {testimonial.name}
                    </span>
                    <span className="text-sm text-muted-foreground truncate">
                      {testimonial.username}
                    </span>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-foreground font-medium line-clamp-4">
                    {testimonial.text}
                  </p>
                </div>
                <button
                  onClick={() => openInNewTab(testimonial.social)}
                  className="absolute top-4 right-4 hover:opacity-80 transition-opacity"
                >
                  <Icons.twitter className="h-4 w-4" aria-hidden="true" />
                </button>
              </Card>
            ))}
        </div>
      </div>
    </div>
  )
}

