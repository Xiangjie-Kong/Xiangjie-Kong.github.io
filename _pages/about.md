---
permalink: /
title: "Introduction"
author_profile: true
redirect_from: 
  - /about/
  - /about.html
---

Kong is an undergraduate student in School of Computer Science and Technology / Faculty of Innovation Engineering at [Macau University of Science and Technology (MUST. 澳門科技大學)](https://www.must.edu.mo/).

Research status
======
Kong is currently an undergraduate student in the Phase Field-Computational Fluids team led by [Prof. Yang Junxiang](https://cfdyang521.github.io/) from the School of Innovative Engineering, Macau University of Science and Technology. His research interests include **3D Volume Reconstruction** and **Scientific Computing**.

Research Achievements
======
Here's my latest research.

![](/images/paper1.png)
[link to paper](https://doi.org/10.1016/j.cnsns.2025.108649)

***Two lower boundedness-preservity auxiliary variable methods for a phase-field model of 3D narrow volume reconstruction*** was accepted by ***Communications in Nonlinear Scienceand Numerical Simulation***, a JCR Q1 top 10% journal, and Kong was the first author of the paper.

In this paper, corresponding author **Prof. Junxiang Yang** proposed the numerical method, and **Kong** contributed all the numerical tests and paper writing as the first author.

---

<style>
@keyframes stripe-animation {
  0% { background-position: 0 0; }
  100% { background-position: 30px 0; }
}

.stat-container {
  display: inline-block;
  padding: 8px 15px;
  margin: 0 10px;
  position: relative;
  background: linear-gradient(45deg, 
    transparent 0%,
    transparent 45%,
    rgba(0,0,0,0.1) 45%,
    rgba(0,0,0,0.1) 55%,
    transparent 55%,
    transparent 100%
  );
  background-size: 30px 100%;
  animation: stripe-animation 1s linear infinite;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.stats-wrapper {
  margin-top: 50px;
  text-align: center;
}

.loading {
  color: #999;
  font-style: italic;
}
</style>

<div class="stats-wrapper">
  <div class="stat-container">
    <span id="busuanzi_container_site_pv" style="font-size: 14px; display: none;">
      Total Visits: <span id="busuanzi_value_site_pv" style="font-weight: bold;"></span>
    </span>
    <span id="pv_loading" class="loading" style="font-size: 14px;">Loading visits...</span>
  </div>
  <div class="stat-container">
    <span id="busuanzi_container_site_uv" style="font-size: 14px; display: none;">
      Unique Visitors: <span id="busuanzi_value_site_uv" style="font-weight: bold;"></span>
    </span>
    <span id="uv_loading" class="loading" style="font-size: 14px;">Loading visitors...</span>
  </div>
</div>

<script>
// 等待不蒜子加载完成
function waitForBusuanzi() {
  let attempts = 0;
  const maxAttempts = 50; // 最多等待5秒
  
  const checkBusuanzi = () => {
    attempts++;
    
    // 检查是否有数据加载
    const pvElement = document.getElementById('busuanzi_value_site_pv');
    const uvElement = document.getElementById('busuanzi_value_site_uv');
    
    if (pvElement && uvElement && pvElement.textContent && uvElement.textContent) {
      // 数据加载成功，显示统计数据
      document.getElementById('busuanzi_container_site_pv').style.display = 'inline';
      document.getElementById('busuanzi_container_site_uv').style.display = 'inline';
      document.getElementById('pv_loading').style.display = 'none';
      document.getElementById('uv_loading').style.display = 'none';
    } else if (attempts < maxAttempts) {
      // 继续等待
      setTimeout(checkBusuanzi, 100);
    } else {
      // 加载超时，显示错误信息
      document.getElementById('pv_loading').textContent = 'Failed to load';
      document.getElementById('uv_loading').textContent = 'Failed to load';
    }
  };
  
  // 页面加载完成后开始检查
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkBusuanzi);
  } else {
    checkBusuanzi();
  }
}

// 启动检查
waitForBusuanzi();
</script>
