/**
 * The honorific markers written in parentheses — `(ص)`, `(ع)`, `(رض)`, `(جل)`, `(صلى الله عليه وسلم)` … — with
 * the picture shown for each one on the page. Also used by the Telegram copy (telegram.ts), which writes the
 * full phrase instead of the picture.
 */

export type HonorificConfig = {
  file: string
  label: string
  width?: string
  height?: string
  verticalAlign?: string
}


const DEFAULT_HONORIFIC_SIZE = '1.8em'
const DEFAULT_HONORIFIC_ALIGN = '-0.4em'
const SMALL_HONORIFIC_SIZE = '1.2em'
const SMALL_HONORIFIC_ALIGN = '-0.15em'
const MEDIUM_HONORIFIC_SIZE = '1.5em'
const MEDIUM_HONORIFIC_ALIGN = '-0.25em'

const createHonorific = (
  file: string,
  label: string,
  size = DEFAULT_HONORIFIC_SIZE,
  verticalAlign = DEFAULT_HONORIFIC_ALIGN,
): HonorificConfig => ({
  file,
  label,
  width: size,
  height: size,
  verticalAlign,
})

export const honorifics: Record<string, HonorificConfig> = {
  // درود بر پیامبر ﷺ
  'ص': createHonorific('sas.svg', 'صلى الله عليه وسلم', MEDIUM_HONORIFIC_SIZE, MEDIUM_HONORIFIC_ALIGN),
  'ﷺ': createHonorific('sas.svg', 'صلى الله عليه وسلم', MEDIUM_HONORIFIC_SIZE, MEDIUM_HONORIFIC_ALIGN),
  'صلى الله عليه وسلم': createHonorific('sas.svg', 'صلى الله عليه وسلم', MEDIUM_HONORIFIC_SIZE, MEDIUM_HONORIFIC_ALIGN),

  // سلام بر پیامبران
  'ع': createHonorific('as.svg', 'عليه السلام'),
  'عليه سلام': createHonorific('as.svg', 'عليه السلام'),
  'عليه الصلاة والسلام': createHonorific('asws.svg', 'عليه الصلاة والسلام'),
  'علیه السلام': createHonorific('asws.svg', 'عليه الصلاة والسلام'),
  'عليها السلام': createHonorific('ahas.svg', 'عليها السلام'),
  'عليهم السلام': createHonorific('amus.svg', 'عليهم السلام'),

  // رضایت خداوند از صحابه
  'رض': createHonorific('radu.svg', 'رضي الله عنه'),
  'رضي الله عنه': createHonorific('radu.svg', 'رضي الله عنه'),
  'رضي الله عنها': createHonorific('rada.svg', 'رضي الله عنها'),
  'رضي الله عنهما': createHonorific('raduma.svg', 'رضي الله عنهما'),
  'رضي الله عنهم': createHonorific('radum.svg', 'رضي الله عنهم'),
  'رضي الله عنهن': createHonorific('radunna.svg', 'رضي الله عنهن'),

  // رحمت خداوند
  'رح': createHonorific('rahimahu.svg', 'رحمه الله'),
  'رحمه الله': createHonorific('rahimahu.svg', 'رحمه الله'),
  'رحمها الله': createHonorific('rahimaha.svg', 'رحمها الله', MEDIUM_HONORIFIC_SIZE, MEDIUM_HONORIFIC_ALIGN),
  'رحمهم الله': createHonorific('rahimahum.svg', 'رحمهم الله'),
  'رحمهما الله': createHonorific('rahimahuma.svg', 'رحمهما الله'),
  'رحمهن الله': createHonorific('rahimahunna.svg', 'رحمهن الله'),

  // عبارات مربوط به خداوند
  'جل جلاله': createHonorific('jal.svg', 'جل جلاله', SMALL_HONORIFIC_SIZE, SMALL_HONORIFIC_ALIGN),
  'عز وجل': createHonorific('awj.svg', 'عز وجل', SMALL_HONORIFIC_SIZE, SMALL_HONORIFIC_ALIGN),
  'جل وعلا': createHonorific('jwa.svg', 'جل وعلا', SMALL_HONORIFIC_SIZE, SMALL_HONORIFIC_ALIGN),
  'سبحانه وتعالى': createHonorific('swt.svg', 'سبحانه وتعالى', SMALL_HONORIFIC_SIZE, SMALL_HONORIFIC_ALIGN),
  'تبارك وتعالى': createHonorific('twt.svg', 'تبارك وتعالى', '1.5em', '-0.25em'),

  // اختصارات مؤنث و جمع
  'رضها': createHonorific('rada.svg', 'رضي الله عنها'),
  'رضهما': createHonorific('raduma.svg', 'رضي الله عنهما'),
  'رضهم': createHonorific('radum.svg', 'رضي الله عنهم'),
  'رضهن': createHonorific('radunna.svg', 'رضي الله عنهن'),

  'رحها': createHonorific('rahimaha.svg', 'رحمها الله', MEDIUM_HONORIFIC_SIZE, MEDIUM_HONORIFIC_ALIGN),
  'رحهم': createHonorific('rahimahum.svg', 'رحمهم الله'),
  'رحهما': createHonorific('rahimahuma.svg', 'رحمهما الله'),
  'رحهن': createHonorific('rahimahunna.svg', 'رحمهن الله'),

  // اختصارات عبارات مربوط به خداوند
  'جل': createHonorific('jal.svg', 'جل جلاله', SMALL_HONORIFIC_SIZE, SMALL_HONORIFIC_ALIGN),
  'عز': createHonorific('awj.svg', 'عز وجل', SMALL_HONORIFIC_SIZE, SMALL_HONORIFIC_ALIGN),
  'سبح': createHonorific('swt.svg', 'سبحانه وتعالى', SMALL_HONORIFIC_SIZE, SMALL_HONORIFIC_ALIGN),
  'تبارك': createHonorific('twt.svg', 'تبارك وتعالى', '1.6em', '-0.25em'),

    // درود بر پیامبر و خاندان ایشان
  'صا': createHonorific('saa.svg', 'صلى الله عليه و آله'),
  'صلى الله عليه و آله': createHonorific('saa.svg', 'صلى الله عليه و آله'),

  // حفظه الله
  'حف': createHonorific('haf.svg', 'حفظه الله'),
  'حفظه الله': createHonorific('haf.svg', 'حفظه الله'),
}
