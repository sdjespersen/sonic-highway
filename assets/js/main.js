// Photo + video carousel
document.querySelectorAll('[data-carousel]').forEach((root) => {
  const track = root.querySelector('[data-track]')
  const slides = [...root.querySelectorAll('[data-slide]')]
  const dotsWrap = root.querySelector('[data-dots]')
  let current = 0

  const dots = slides.map((_, i) => {
    const b = document.createElement('button')
    b.type = 'button'
    b.setAttribute('aria-label', `Go to slide ${i + 1}`)
    b.addEventListener('click', () => go(i))
    dotsWrap.appendChild(b)
    return b
  })

  const pauseOthers = (active) => {
    slides.forEach((s, i) => {
      if (i === active) return
      s.querySelectorAll('video').forEach((v) => v.pause())
      s.querySelectorAll('iframe').forEach((f) =>
        f.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*'),
      )
    })
  }

  const setCurrent = (i) => {
    current = i
    dots.forEach((d, j) => d.setAttribute('aria-current', j === i ? 'true' : 'false'))
    pauseOthers(i)
  }

  const go = (i) => {
    const target = slides[(i + slides.length) % slides.length]
    track.scrollTo({ left: target.offsetLeft - track.offsetLeft, behavior: 'smooth' })
  }

  root.querySelector('[data-prev]').addEventListener('click', () => go(current - 1))
  root.querySelector('[data-next]').addEventListener('click', () => go(current + 1))
  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(current + 1) }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(current - 1) }
  })

  const io = new IntersectionObserver(
    (entries) => entries.forEach((en) => en.isIntersecting && setCurrent(slides.indexOf(en.target))),
    { root: track, threshold: 0.6 },
  )
  slides.forEach((s) => io.observe(s))
  setCurrent(0)
})

// Contact form (Netlify Forms, submitted without a page reload)
document.querySelectorAll('[data-contact-form]').forEach((form) => {
  const status = form.querySelector('.form__status')
  const button = form.querySelector('button[type="submit"]')

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    button.disabled = true
    status.classList.remove('is-error')
    status.textContent = 'Sending…'
    try {
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)).toString(),
      })
      if (!res.ok) throw new Error(res.statusText)
      form.reset()
      status.textContent = status.dataset.success
    } catch {
      status.classList.add('is-error')
      status.textContent = 'Something went wrong. Please try again, or email us directly.'
    } finally {
      button.disabled = false
    }
  })
})
