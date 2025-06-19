// StartScreen.js
export function createStartScreen({ onPlay }) {


  const div = document.createElement('div');
  div.id = 'startScreen';
  div.innerHTML = `
    <div class="panel">
      <h1>Minecraft VoxelWorld</h1>

      <button id="playBtn">Gioca</button>

      <ul class="keys">
        <li><b>W A S D</b> – Move</li>
        <li><b>Space</b> – Jump</li>
        <li><b>R</b> – Respawn</li>
        <li><b>U</b> – Show/Hide UI</li>
      </ul>
    </div>
  `;
  document.body.appendChild(div);

  const css = document.createElement('style');
  css.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

    #startScreen{
      position:fixed; inset:0;
      background:url('img/menu_bg.png') center/cover no-repeat;
      display:flex; justify-content:center; align-items:center;
      font-family:'Press Start 2P', monospace;
      image-rendering:pixelated; color:#fff;
    }
    #startScreen .panel{
      background:rgba(0,0,0,.55);
      padding:3rem 4rem; border:2px solid #222; border-radius:8px;
      text-align:center;
      box-shadow:0 0 16px #000c;
    }
    #startScreen h1{ margin:0 0 2rem; font-size:1.25rem; }
    #playBtn{
      padding:1rem 3rem; margin-bottom:1.5rem;
      font-family:inherit; font-size:1rem; cursor:pointer;
      background:#44aa22; border:none; border-radius:4px;
      color:#fff; box-shadow:0 0 0 2px #111;
    }
    #playBtn:hover{ background:#55cc33; }
    .keys{ list-style:none; margin:0; padding:0; font-size:.8rem; line-height:1.6; }
    .keys li{ white-space:nowrap; }
  `;
  document.head.appendChild(css);

  div.querySelector('#playBtn').addEventListener('click', () => {
    div.remove();               
    onPlay();                
  });
}
