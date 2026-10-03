import './styles/main.css';
import './styles/project.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import info from './data/info.json';
import { projects } from './data/projects.js';
import { fillContent } from './modules/content.js';
import { initScroll } from './modules/scroll.js';
import { createProjectInfo } from './modules/projectInfo.js';
import { getProjectAssets } from './modules/projectAssets.js';

gsap.registerPlugin(ScrollTrigger);

// The intro animation assumes the page starts at the top
history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// project.html?id=3 -> the project with "id": 3 in projects.json
const id = Number(new URLSearchParams(location.search).get('id'));
const index = projects.findIndex((project) => project.id === id);

function renderGallery(container, gallery, title) {
  container.replaceChildren(
    ...gallery.map((file, i) => {
      if (file.isVideo) {
        const video = document.createElement('video');
        Object.assign(video, { src: file.url, autoplay: true, muted: true, loop: true, playsInline: true });
        return video;
      }
      const img = document.createElement('img');
      Object.assign(img, { src: file.url, alt: `${title} — ${info.project.imageAlt} ${i + 1}`, loading: 'lazy' });
      return img;
    })
  );
}

// Image center relative to the hero, so `top` can be tweened (the CSS centers it with translate -50%)
function measure(media, hero) {
  const rect = media.getBoundingClientRect();
  const heroTop = hero.getBoundingClientRect().top;
  return { width: rect.width, height: rect.height, top: rect.top - heroTop + rect.height / 2 };
}

function playIntro() {
  const hero = document.querySelector('.project-hero');
  const media = hero.querySelector('.project-hero__media');
  const cover = hero.querySelector('[data-hero-cover]');
  // Everything from the Work frame except the title fades away
  const extras = [
    ...hero.querySelectorAll('.work__label, .work__hint'),
    ...document.querySelectorAll('.project-info > :not(.project-info__title)'),
  ];

  if (reducedMotion) {
    media.classList.add('is-expanded');
    gsap.set(extras, { autoAlpha: 0 });
    gsap.set(cover, { opacity: 1 });
    return Promise.resolve();
  }

  // Measure the start (carousel size) and end (16:9) states from the CSS, then tween between them
  const start = measure(media, hero);
  media.classList.add('is-expanded');
  const end = measure(media, hero);

  return gsap
    .timeline()
    .to(extras, { autoAlpha: 0, duration: 0.5, ease: 'power1.out' }, 0)
    .fromTo(
      media,
      start,
      // clearProps hands control back to the CSS, so the image stays responsive on resize
      { ...end, duration: 1.4, ease: 'expo.inOut', clearProps: 'width,height,top' },
      0.2
    )
    .to(cover, { opacity: 1, duration: 0.9, ease: 'power1.inOut' }, 0.5)
    .then();
}

async function init() {
  // Unknown or missing id: go back to the home page
  if (index === -1) {
    location.replace('./');
    return;
  }
  const project = projects[index];
  const { cover, gallery } = getProjectAssets(project.id);

  fillContent();
  document.title = `${project.title} — ${info.name}`;
  // Back link lands on this same project inside the carousel
  document.querySelector('[data-back]').href = `./?project=${index}#work`;
  createProjectInfo(document.querySelector('.project-info')).show(index);

  // Starts with the carousel image; the cover (16:9) fades in while it grows. No cover yet -> reuse the carousel image
  const startImg = document.querySelector('[data-hero-start]');
  const coverImg = document.querySelector('[data-hero-cover]');
  startImg.src = project.image;
  coverImg.src = cover ?? project.image;
  coverImg.alt = project.title;

  const gallerySection = document.querySelector('[data-gallery]');
  renderGallery(gallerySection, gallery, project.title);

  // A broken image must not block the intro, so failures count as done
  await Promise.allSettled([document.fonts.ready, startImg.decode(), coverImg.decode()]);
  await playIntro();

  document.body.classList.remove('is-loading');
  initScroll({ reducedMotion });

  if (!reducedMotion) {
    gallerySection.querySelectorAll('img, video').forEach((item) => {
      gsap.from(item, {
        opacity: 0,
        y: 60,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: { trigger: item, start: 'top 90%' },
      });
    });
  }
}

init();
