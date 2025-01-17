// main.js
import SculptGL from './SculptGL.js';

/**
 * 앱 진입점
 */
function main() {
  // SculptGL 인스턴스 생성
  const sculptGL = new SculptGL();

  sculptGL.start();

  // 사용자가 직접 이벤트를 활성화하도록 설계되어 있으므로 addEvents() 호출
  // (SculptGL 내부에서 이벤트를 등록해도 되지만, 예제상 명시적으로 호출)
  sculptGL.addEvents();

  // 초기 렌더링 호출
  sculptGL.render();

  // 창 크기 변경 시 캔버스 사이즈 맞추기
  window.addEventListener('resize', () => {
    // 새로운 크기를 캔버스에 반영
    sculptGL._canvas.width = window.innerWidth;
    sculptGL._canvas.height = window.innerHeight;

    // Scene(부모 클래스)에서 쓰이는 관련 오프셋, 높이 값도 업데이트
    sculptGL._canvasOffsetLeft = sculptGL._canvas.offsetLeft;
    sculptGL._canvasOffsetTop = sculptGL._canvas.offsetTop;
    sculptGL._canvasHeight = sculptGL._canvas.height;

    // 리사이즈 후 다시 렌더링
    sculptGL.render();
  });
}

// 실행
main();
