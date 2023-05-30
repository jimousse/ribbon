uniform vec2 uMouse;
uniform vec2 viewport;
varying vec2 vUv;

float createCircle() {
  float viewportAspect = viewport.y / viewport.x;
  vec2 mousePoint = uMouse / viewport;
  mousePoint.y = 1.0 - mousePoint.y;
  vec2 currentPoint = gl_FragCoord.xy / viewport;
  float circleRadius = 0.1;
  float dist = distance(
    vec2(currentPoint.x / viewportAspect, currentPoint.y), 
    vec2(mousePoint.x / viewportAspect, mousePoint.y)
  );
  dist = smoothstep(circleRadius, circleRadius + 0.001, dist);
  return dist;
}

void main() {
  float circle = createCircle();
  gl_FragColor = vec4(vec3(circle), 1.0);
}