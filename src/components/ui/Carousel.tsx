import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { applyOfflineImageFallback } from './imageFallback'
import { cx } from '../utils/cx'

type CarouselProps = {
  imageUrls: string[]
  alt: string
  className?: string
  imageClassName?: string
}

export function Carousel({ imageUrls, alt, className, imageClassName }: CarouselProps) {
  const [index, setIndex] = useState(0)
  const count = imageUrls.length

  if (count === 0) return null

  const prev = () => setIndex((i) => (i === 0 ? count - 1 : i - 1))
  const next = () => setIndex((i) => (i === count - 1 ? 0 : i + 1))

  return (
    <div className={cx('relative overflow-hidden rounded-2xl bg-slate-100', className)}>
      <img
        src={imageUrls[index]}
        alt={`${alt} — фото ${index + 1}`}
        className={cx('h-full w-full object-cover', imageClassName)}
        onError={applyOfflineImageFallback}
      />
      {count > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-slate-700 shadow-md transition-[background-color,transform] duration-200 hover:bg-white active:scale-95"
            aria-label="Предыдущее фото"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-slate-700 shadow-md transition-[background-color,transform] duration-200 hover:bg-white active:scale-95"
            aria-label="Следующее фото"
          >
            <ChevronRight className="size-5" />
          </button>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
            {imageUrls.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                className={cx(
                  'h-2 w-2 rounded-full transition-[background-color,transform] duration-200',
                  i === index ? 'bg-white shadow' : 'bg-white/60 hover:bg-white/80',
                )}
                aria-label={`Фото ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
