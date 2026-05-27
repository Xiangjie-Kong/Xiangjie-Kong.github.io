---
layout: archive
title: "CV"
permalink: /cv/
author_profile: true
redirect_from:
  - /resume
---

{% include base_path %}

<div class="cv-page">
  <div class="cv-intro">
    <p>
      A structured overview of my education, internship experience, awards,
      technical skills, and publications.
    </p>
  </div>

  <section class="cv-card" id="general-information">
    <h2>General Information</h2>
    <dl class="cv-info-grid">
      <dt>Full Name</dt>
      <dd>Xiangjie Kong</dd>
      <dt>Email</dt>
      <dd><a href="mailto:1220019046@student.must.edu.mo">1220019046@student.must.edu.mo</a></dd>
      <dt>Location</dt>
      <dd>Macao SAR, China</dd>
      <dt>Field</dt>
      <dd>Computer Science</dd>
    </dl>
  </section>

  <section class="cv-card" id="education">
    <h2>Education</h2>
    <ol class="cv-timeline">
      <li class="cv-timeline__item">
        <span class="cv-timeline__date">2026</span>
        <div class="cv-timeline__body">
          <h3>MPhil</h3>
          <p class="cv-place">Hong Kong University of Science and Technology (Guangzhou)</p>
        </div>
      </li>
      <li class="cv-timeline__item">
        <span class="cv-timeline__date">2022</span>
        <div class="cv-timeline__body">
          <h3>B.S. in Computer Science</h3>
          <p class="cv-place">Macau University of Science and Technology</p>
        </div>
      </li>
    </ol>
  </section>

  <section class="cv-card" id="experience">
    <h2>Experience</h2>
    <ol class="cv-timeline">
      <li class="cv-timeline__item">
        <span class="cv-timeline__date">2024</span>
        <div class="cv-timeline__body">
          <h3>Software Engineer Intern</h3>
          <p class="cv-place">Inspur, intelligent healthcare, Shandong</p>
          <p class="cv-period">June 2024 - September 2024</p>
          <ul>
            <li>Extracted metadata from EHR scripts.</li>
            <li>Created graph database assets for healthcare data workflows.</li>
            <li>Worked on front-end design and development.</li>
            <li>Processed and shuffled data inside CSV files.</li>
          </ul>
        </div>
      </li>
      <li class="cv-timeline__item">
        <span class="cv-timeline__date">2023</span>
        <div class="cv-timeline__body">
          <h3>Software Engineer Intern</h3>
          <p class="cv-place">Shandong Taiwei Digital Software Co., Shandong</p>
          <p class="cv-period">June 2023 - August 2023</p>
          <ul>
            <li>Worked on low-code development.</li>
            <li>Designed software through the YIDA platform in Alibaba's DingTalk software.</li>
          </ul>
        </div>
      </li>
    </ol>
  </section>

  <section class="cv-card" id="honors-and-awards">
    <h2>Honors and Awards</h2>
    <ol class="cv-timeline cv-timeline--compact">
      <li class="cv-timeline__item">
        <span class="cv-timeline__date">2024</span>
        <div class="cv-timeline__body">
          <h3>Tencent AI Arena Global Open Competition</h3>
          <p class="cv-place">Intelligent Agent Gaming Algorithm Track, World Finals - 15th Place</p>
        </div>
      </li>
      <li class="cv-timeline__item">
        <span class="cv-timeline__date">2024</span>
        <div class="cv-timeline__body">
          <h3>14th National College Students' E-Commerce Challenge</h3>
          <p class="cv-place">Innovation, Creativity and Entrepreneurship Challenge, Provincial Second Prize</p>
        </div>
      </li>
      <li class="cv-timeline__item">
        <span class="cv-timeline__date">2023/24</span>
        <div class="cv-timeline__body">
          <h3>Dean's Honor List</h3>
          <p class="cv-place">2023/2024 academic year</p>
        </div>
      </li>
    </ol>
  </section>

  <section class="cv-card" id="skills">
    <h2>Skills</h2>
    <div class="cv-skill-group">
      <h3>Coding Languages</h3>
      <ul class="cv-tags">
        <li>C++</li>
        <li>C</li>
        <li>LaTeX</li>
        <li>Python</li>
        <li>MATLAB</li>
        <li>HTML</li>
      </ul>
    </div>
    <div class="cv-skill-group">
      <h3>Technologies</h3>
      <ul class="cv-tags">
        <li>VS Code</li>
        <li>MATLAB</li>
        <li>PyCharm</li>
        <li>Colab</li>
        <li>Vue.js</li>
        <li>Node.js</li>
      </ul>
    </div>
  </section>

  <section class="cv-card" id="publications">
    <h2>Publications</h2>
    <ul class="cv-publications">
      {% for post in site.publications reversed %}
        {% assign title = post.title | markdownify | remove: "<p>" | remove: "</p>" %}
        <li>
          <h3><a href="{{ base_path }}{{ post.url }}">{{ title }}</a></h3>
          {% if post.citation %}
            {% assign citation = post.citation | strip_html | strip_newlines | escape %}
            <button class="cv-copy-citation" type="button" data-citation="{{ citation }}" aria-label="Copy citation for {{ title | strip_html | escape }}">
              <span class="cv-copy-citation__label">Copy citation</span>
            </button>
          {% endif %}
        </li>
      {% endfor %}
    </ul>
  </section>
</div>

<script>
  (function () {
    function copyText(text) {
      if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text);
      }

      var textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.setAttribute("readonly", "");
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.select();

      try {
        document.execCommand("copy");
        return Promise.resolve();
      } catch (error) {
        return Promise.reject(error);
      } finally {
        document.body.removeChild(textArea);
      }
    }

    document.querySelectorAll(".cv-copy-citation").forEach(function (button) {
      var label = button.querySelector(".cv-copy-citation__label");
      var defaultText = label.textContent;

      button.addEventListener("click", function () {
        copyText(button.getAttribute("data-citation")).then(function () {
          label.textContent = "Copied";
          button.classList.add("is-copied");

          window.setTimeout(function () {
            label.textContent = defaultText;
            button.classList.remove("is-copied");
          }, 1800);
        }).catch(function () {
          label.textContent = "Copy failed";

          window.setTimeout(function () {
            label.textContent = defaultText;
          }, 1800);
        });
      });
    });
  }());
</script>
