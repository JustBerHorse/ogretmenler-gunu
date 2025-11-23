(() => {
  const canvas = document.getElementById('garden');
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0;

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;
  }
  window.addEventListener('resize', resize);
  resize();

  const rand = (a,b) => a + Math.random()*(b-a);
  const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

  const PETAL_PALETTES = [
    ['#ffc3d1','#ff8fb1','#ff5c91'],
    ['#ffb8d4','#ff86b3','#ff5391'],
    ['#ffd1e0','#ffa1c0','#ff719f']
  ];

  class Flower {
    constructor(x, groundY) {
      this.x = x;
      this.groundY = groundY;
      this.stemLength = 0;
      this.targetStem = rand(120, H*0.35);
      this.stemSpeed = rand(90, 160);
      this.bloomProgress = 0;
      this.state = 'growing';
      this.colorSet = PETAL_PALETTES[Math.floor(Math.random()*PETAL_PALETTES.length)];
      this.petalCount = Math.floor(rand(5,7));
      this.petalRadius = rand(80, 140); // daha kocaman
      this.stemJiggle = rand(0.6, 1.5);
      this.seed = Math.random()*10000;

      // Yapraklar sabit ve zambak gibi
      this.leaves = [];
      const leafCount = Math.floor(rand(2,3));
      for(let i=0;i<leafCount;i++){
        this.leaves.push({
          pos: rand(0.3,0.7),
          width: rand(22,32),  // geniş oval
          height: rand(12,18),
          flip: Math.random() < 0.5 ? -1 : 1
        });
      }
    }

    update(dt, t) {
      if (this.state === 'growing') {
        this.stemLength += this.stemSpeed * dt;
        if (this.stemLength >= this.targetStem) {
          this.stemLength = this.targetStem;
          this.state = 'blooming';
          this.bloomStart = t;
        }
      } else if (this.state === 'blooming') {
        const since = (t - this.bloomStart)/800;
        this.bloomProgress = Math.min(1, easeOutCubic(since));
        if (this.bloomProgress >= 1) this.state = 'done';
      }
    }

    draw(ctx, t) {
      const baseX = this.x + Math.sin((t*0.0006 + this.seed)*this.stemJiggle)*6;
      const baseY = this.groundY;
      const topY = baseY - this.stemLength;

      // Stem
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(baseX, baseY);
      const midY = baseY - this.stemLength*0.5;
      const controlX = baseX + Math.sin((t*0.001 + this.seed))*20;
      ctx.quadraticCurveTo(controlX, midY, baseX + Math.sin((t*0.0015 + this.seed)*1.2)*4, topY);
      ctx.strokeStyle = 'rgba(120,185,95,0.95)';
      ctx.lineWidth = Math.max(2, this.stemLength*0.02);
      ctx.stroke();

      // Yapraklar sabit, dalgalanma yok
      for(const lf of this.leaves){
        const ly = baseY - this.stemLength * lf.pos;
        const lx = baseX + lf.flip*12;
        ctx.beginPath();
        ctx.ellipse(lx, ly, lf.width, lf.height, 0, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(94,153,64,0.85)';
        ctx.fill();
      }

      // Bloom
      const bloomSize = this.petalRadius*(0.2 + 0.8*this.bloomProgress);
      const centerX = baseX;
      const centerY = topY;

      for (let i=0; i<this.petalCount; i++){
        const angle = (i/this.petalCount)*Math.PI*2;
        const open = this.bloomProgress;
        const px = centerX + Math.cos(angle)*bloomSize*(1+0.4*open);
        const py = centerY + Math.sin(angle)*bloomSize*(1+0.4*open);

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        const midx = centerX + Math.cos(angle)*bloomSize*0.5;
        const midy = centerY + Math.sin(angle)*bloomSize*0.5;
        ctx.quadraticCurveTo(midx, midy - 6*(1-open), px, py);
        ctx.lineTo(centerX, centerY);

        const grad = ctx.createRadialGradient(px, py, 2, px, py, bloomSize*0.9);
        grad.addColorStop(0, this.colorSet[0]);
        grad.addColorStop(0.6, this.colorSet[1]);
        grad.addColorStop(1, this.colorSet[2]);
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }

      // Center
      ctx.beginPath();
      ctx.arc(centerX, centerY, Math.max(6, bloomSize*0.28), 0, Math.PI*2);
      ctx.fillStyle = 'rgba(255,220,180,0.95)';
      ctx.fill();
      ctx.restore();
    }
  }

  const flowers = [];
  const groundY = H - 18;

  // Çiçek sayısı artırıldı
  for (let i=0; i<12; i++){
    const x = rand(80, W-80);
    flowers.push(new Flower(x, groundY));
  }

  let last = performance.now();
  function frame(now){
    const dt = Math.min(0.06, (now-last)/1000);
    last = now;

    ctx.clearRect(0,0,W,H);

    const g = ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#07101b');
    g.addColorStop(0.5,'#071224');
    g.addColorStop(1,'#061017');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,W,H);

    ctx.fillStyle = '#061214';
    ctx.fillRect(0, groundY+8, W, H-groundY);

    for(let f of flowers){
      f.update(dt, now);
      f.draw(ctx, now);
    }

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();
