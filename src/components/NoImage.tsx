import noImageSvg from "../../content/blog/noImage.svg"

export function NoImage({ className = ''}: { className?: string }){
    return (
        <div
            role="img"
            aria-label="تصویر پیش فرض مقاله"
            className={`aspect-video w-full overflow-hidden ${className}`}
            dangerouslySetInnerHTML={{ __html:noImageSvg }}
        />
    )
}