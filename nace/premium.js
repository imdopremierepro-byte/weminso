const topbar = document.querySelector(".topbar");
const menu = document.querySelector(".menu");
const mobile = document.querySelector(".mobile-menu");

const updateHeader = () => topbar?.classList.toggle("solid", scrollY > 40);
updateHeader();
addEventListener("scroll", updateHeader, { passive: true });

menu?.addEventListener("click", () => {
  const open = menu.getAttribute("aria-expanded") !== "true";
  menu.setAttribute("aria-expanded", String(open));
  menu.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
  mobile?.classList.toggle("open", open);
});

mobile?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
  menu?.setAttribute("aria-expanded", "false");
  menu?.setAttribute("aria-label", "메뉴 열기");
  mobile.classList.remove("open");
}));

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("visible");
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.1, rootMargin: "0px 0px -45px" });
document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

const form = document.querySelector(".join-form");
form?.addEventListener("submit", (event) => {
  const selectedCourses = form.querySelectorAll('input[name="참여 과정"]:checked');
  const note = form.querySelector(".form-note");
  if (!selectedCourses.length) {
    event.preventDefault();
    note.textContent = "참여 희망 과정을 하나 이상 선택해 주세요.";
    note.classList.add("error");
    form.querySelector('input[name="참여 과정"]')?.focus();
    return;
  }
  note.textContent = "신청서를 안전하게 전송하고 있습니다.";
  note.classList.remove("error");
  const button = form.querySelector("button");
  button.disabled = true;
  button.firstChild.textContent = "전송 중... ";
});
