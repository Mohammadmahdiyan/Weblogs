export function NoImage({ className = '' }: { className?: string }) {
  return (
    <div role="img" aria-label="تصویر پیش‌فرض مقاله" className={`aspect-video w-full overflow-hidden ${className}`}>
      <img src={`${import.meta.env.BASE_URL}noImage.svg`} alt="" className="size-full object-contain" />
    </div>
  )
}
