precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform vec4 uResolution;
uniform vec3 uColor;
uniform vec3 uFresnelColor;
uniform float uFresnelPower;
uniform float uRadius;
uniform float uSmoothness;

float PI = 3.141592653589793238;

mat4 rotationMatrix(vec3 axis, float angle) {
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                0.0,                                0.0,                                0.0,                                1.0);
}

vec3 rotate(vec3 v, vec3 axis, float angle) {
    mat4 m = rotationMatrix(axis, angle);
    return (m * vec4(v, 1.0)).xyz;
}

float smin( float a, float b, float k ) {
    k *= 6.0;
    float h = max( k-abs(a-b), 0.0 )/k;
    return min(a,b) - h*h*h*k*(1.0/6.0);
}

float sphereSDF(vec3 p, float r) {
    return length(p) - r;
}

float sdf(vec3 p) {
    vec3 p1 = rotate(p, vec3(0.0, 0.0, 1.0), uTime/5.0);
    vec3 p2 = rotate(p, vec3(1.), -uTime/5.0);
    vec3 p3 = rotate(p, vec3(1., 1., 0.), -uTime/4.5);
    vec3 p4 = rotate(p, vec3(0., 1., 0.), -uTime/4.0);

    float r = uRadius;

    float final = sphereSDF(p1 - vec3(-0.5, 0.0, 0.0), 0.35 * r);
    float nextSphere = sphereSDF(p2 - vec3(0.55, 0.0, 0.0), 0.3 * r);
    final = smin(final, nextSphere, uSmoothness);
    nextSphere = sphereSDF(p2 - vec3(-0.8, 0.0, 0.0), 0.2 * r);
    final = smin(final, nextSphere, uSmoothness);
    nextSphere = sphereSDF(p3 - vec3(1.0, 0.0, 0.0), 0.15 * r);
    final = smin(final, nextSphere, uSmoothness);
    nextSphere = sphereSDF(p4 - vec3(0.45, -0.45, 0.0), 0.15 * r);
    final = smin(final, nextSphere, uSmoothness);

    return final;
}

vec3 getNormal(vec3 p) {
    float d = 0.001;
    return normalize(vec3(
        sdf(p + vec3(d, 0.0, 0.0)) - sdf(p - vec3(d, 0.0, 0.0)),
        sdf(p + vec3(0.0, d, 0.0)) - sdf(p - vec3(0.0, d, 0.0)),
        sdf(p + vec3(0.0, 0.0, d)) - sdf(p - vec3(0.0, 0.0, d))
    ));
}

float rayMarch(vec3 rayOrigin, vec3 ray) {
    float t = 0.0;
    for (int i = 0; i < 100; i++) {
        vec3 p = rayOrigin + ray * t;
        float d = sdf(p);
        if (d < 0.001) return t;
        t += d;
        if (t > 100.0) break;
    }
    return -1.0;
}

void main() {
    vec2 newUV = (vUv - vec2(0.5)) * uResolution.zw + vec2(0.5);
    vec3 cameraPos = vec3(0.0, 0.0, 5.0);
    vec3 ray = normalize(vec3((vUv - vec2(0.5)) * uResolution.zw, -1));

    float t = rayMarch(cameraPos, ray);
    if (t > 0.0) {
        vec3 p = cameraPos + ray * t;
        vec3 normal = getNormal(p);
        float fresnel = pow(1.0 + dot(ray, normal), uFresnelPower);


        vec3 color = mix(uColor, uFresnelColor, fresnel);

        gl_FragColor = vec4(color, 1.0);
    } else {
         gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
    }
    #include <colorspace_fragment>
}
