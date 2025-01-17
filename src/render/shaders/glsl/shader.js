export const colorSpaceGLSL = `
// reference
// https://www.khronos.org/registry/gles/extensions/EXT/EXT_sRGB.txt

#define LIN_SRGB(x) x < 0.0031308 ? x * 12.92 : 1.055 * pow(x, 1.0/2.4) - 0.055
float linearTosRGB(const in float c) {
    return LIN_SRGB(c);
}
vec3 linearTosRGB(const in vec3 c) {
    return vec3(LIN_SRGB(c.r), LIN_SRGB(c.g), LIN_SRGB(c.b));
}
vec4 linearTosRGB(const in vec4 c) {
    return vec4(LIN_SRGB(c.r), LIN_SRGB(c.g), LIN_SRGB(c.b), c.a);
}

#define SRGB_LIN(x) x < 0.04045 ? x * (1.0 / 12.92) : pow((x + 0.055) * (1.0 / 1.055), 2.4)
float sRGBToLinear(const in float c) {
    return SRGB_LIN(c);
}
vec3 sRGBToLinear(const in vec3 c) {
    return vec3(SRGB_LIN(c.r), SRGB_LIN(c.g), SRGB_LIN(c.b));
}
vec4 sRGBToLinear(const in vec4 c) {
    return vec4(SRGB_LIN(c.r), SRGB_LIN(c.g), SRGB_LIN(c.b), c.a);
}

#define RANGE 5.0
// http://graphicrants.blogspot.fr/2009/04/rgbm-color-encoding.html
vec4 encodeRGBM(const in vec3 col) {
    vec4 rgbm;
    vec3 color = col / RANGE;
    rgbm.a = clamp( max( max( color.r, color.g ), max( color.b, 1e-6 ) ), 0.0, 1.0 );
    rgbm.a = ceil( rgbm.a * 255.0 ) / 255.0;
    rgbm.rgb = color / rgbm.a;
    return rgbm;
}

vec3 decodeRGBM(const in vec4 col) {
  return RANGE * col.rgb * col.a;
}
`;

export const curvatureGLSL = `
// http://madebyevan.com/shaders/curvature/
#extension GL_OES_standard_derivatives : enable
vec3 computeCurvature( const in vec3 vertex, const in vec3 normal, const in vec3 color, const in float str, const in float fov) {
  if(str < 1e-3)
    return color;
#ifndef GL_OES_standard_derivatives
    return color * pow(length(normal), str * 100.0);
#else
  vec3 n = normalize(normal);
  // Compute curvature
  vec3 dx = dFdx(n);
  vec3 dy = dFdy(n);
  vec3 xneg = n - dx;
  vec3 xpos = n + dx;
  vec3 yneg = n - dy;
  vec3 ypos = n + dy;
  // fov < 0.0 means ortho
  float depth = fov > 0.0 ? length(vertex) * fov : -fov;
  float cur = (cross(xneg, xpos).y - cross(yneg, ypos).x) * str * 80.0 / depth;
  return mix(mix(color, color * 0.3, clamp(-cur * 15.0, 0.0, 1.0)), color * 2.0, clamp(cur * 25.0, 0.0, 1.0));
#endif
}
`;

export const fxaaGLSL = `
// https://github.com/mattdesl/glsl-fxaa
#define FXAA_REDUCE_MIN (1.0/ 128.0)
#define FXAA_REDUCE_MUL (1.0 / 8.0)
#define FXAA_SPAN_MAX 8.0

vec3 fxaa(const in sampler2D tex, const in vec2 uvNW, const in vec2 uvNE, const in vec2 uvSW, const in vec2 uvSE, const in vec2 uvM, const in vec2 invRes) {
    const vec3 luma = vec3(0.299, 0.587, 0.114);
    float lumaNW = dot(texture2D(tex, uvNW).xyz, luma);
    float lumaNE = dot(texture2D(tex, uvNE).xyz, luma);
    float lumaSW = dot(texture2D(tex, uvSW).xyz, luma);
    float lumaSE = dot(texture2D(tex, uvSE).xyz, luma);
    float lumaM  = dot(texture2D(tex, uvM).xyz,  luma);
    float lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));
    float lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));

    vec2 dir = vec2(-((lumaNW + lumaNE) - (lumaSW + lumaSE)), ((lumaNW + lumaSW) - (lumaNE + lumaSE)));
    float dirReduce = max((lumaNW + lumaNE + lumaSW + lumaSE) * (0.25 * FXAA_REDUCE_MUL), FXAA_REDUCE_MIN);
    float rcpDirMin = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);
    dir = min(vec2(FXAA_SPAN_MAX, FXAA_SPAN_MAX), max(vec2(-FXAA_SPAN_MAX, -FXAA_SPAN_MAX), dir * rcpDirMin)) * invRes;
    
    vec3 rgbA = 0.5 * ( texture2D(tex, uvM + dir * (1.0 / 3.0 - 0.5)).xyz + texture2D(tex, uvM + dir * (2.0 / 3.0 - 0.5)).xyz);
    vec3 rgbB = rgbA * 0.5 + 0.25 * ( texture2D(tex, uvM - dir * 0.5).xyz + texture2D(tex, uvM + dir * 0.5).xyz);
    
    float lumaB = dot(rgbB, luma);
    if((lumaB < lumaMin) || (lumaB > lumaMax))
      return rgbA;
    return rgbB;
}
`;

export const mainBackgroundGLSL = `
uniform int uBackgroundType;
uniform float uBlur;

void main() {
  vec3 color;
  if (uBackgroundType == 0) {
    color = sRGBToLinear(texture2D(uTexture0, vTexCoord).rgb);
  } else {
    vec3 dir = uIblTransform * vec3(vTexCoord.xy * 2.0 - 1.0, -1.0);
    dir = normalize(dir);
    if (uBackgroundType == 1) {
      color = texturePanoramaLod(dir, uBlur * uBlur);
    } else {
      color = sphericalHarmonics(dir);
    }
  }
  gl_FragColor = encodeRGBM(color);
}
`;

export const outlineGLSL = `

float outlineDistance( const in vec2 uv, const in sampler2D tex, const in vec2 invSize ) {
  float fac0 = 2.0;
  float fac1 = 1.0;
  float ox = invSize.x;
  float oy = invSize.y;
  vec4 texel0 = texture2D(tex, uv + vec2(ox, oy));
  vec4 texel1 = texture2D(tex, uv + vec2(ox, 0.0));
  vec4 texel2 = texture2D(tex, uv + vec2(ox, -oy));
  vec4 texel3 = texture2D(tex, uv + vec2(0.0, -oy));
  vec4 texel4 = texture2D(tex, uv + vec2(-ox, -oy));
  vec4 texel5 = texture2D(tex, uv + vec2(-ox, 0.0));
  vec4 texel6 = texture2D(tex, uv + vec2(-ox, oy));
  vec4 texel7 = texture2D(tex, uv + vec2(0.0, oy));
  vec4 rowx = -fac0 * texel5 + fac0 * texel1 + -fac1 * texel6 + fac1 * texel0 + -fac1 * texel4 + fac1 * texel2;
  vec4 rowy = -fac0 * texel3 + fac0 * texel7 + -fac1 * texel4 + fac1 * texel6 + -fac1 * texel2 + fac1 * texel0;
  return dot(rowy, rowy) + dot(rowx, rowx);
}

`;

export const pbrGLSL = `
#define PI 3.1415926535897932384626433832795
#define PI_2 (2.0 * 3.1415926535897932384626433832795)
#define INV_PI 1.0 / PI
#define INV_LOG2 1.4426950408889634073599246810019

uniform sampler2D uTexture0;
uniform float uExposure;
uniform mat3 uIblTransform;
uniform vec3 uSPH[9];

uniform vec2 uEnvSize;
#define LIMIT_LOD 5.0

// https://mynameismjp.wordpress.com/2008/12/12/logluv-encoding-for-hdr/
const mat3 LUVInverse = mat3(6.0013, -2.700, -1.7995, -1.332, 3.1029, -5.7720,
                             0.3007, -1.088, 5.6268);
vec3 decodeLUV(const in vec4 logLuv) {
  float Le = logLuv.z * 255.0 + logLuv.w;
  vec3 xp;
  xp.y = exp2((Le - 127.0) / 2.0);
  xp.z = xp.y / logLuv.y;
  xp.x = logLuv.x * xp.z;
  return max(LUVInverse * xp, 0.0);
}

vec2 toUVMipmap(const in float lod, const in vec2 uv) {
  float widthForLevel = uEnvSize.x / exp2(lod);
  vec2 uvSpaceLocal = vec2(1.0) + uv * (widthForLevel - 2.0);
  uvSpaceLocal.y += uEnvSize.y - widthForLevel * 2.0;
  return uvSpaceLocal / uEnvSize;
}

vec2 directionToUV(const in vec3 dir) {
  vec3 signOct = sign(dir);
  vec3 uvOct = dir / dot(dir, signOct);
  if (uvOct.z < 0.0) {
    uvOct.xy = signOct.xy * (1.0 - abs(uvOct)).yx;
  }
  return uvOct.xy * 0.5 + 0.5;
}

vec3 texturePanoramaLod(const in vec3 direction, const in float rLinear) {
  float lod = rLinear * (LIMIT_LOD - 1.0);
  vec2 uvBase = directionToUV(direction);
  return decodeLUV(mix(texture2D(uTexture0, toUVMipmap(floor(lod), uvBase)),
                       texture2D(uTexture0, toUVMipmap(ceil(lod), uvBase)),
                       fract(lod)));
}

vec3 integrateBRDFApprox(const in vec3 specular, float roughness, float NoV) {
  const vec4 c0 = vec4(-1, -0.0275, -0.572, 0.022);
  const vec4 c1 = vec4(1, 0.0425, 1.04, -0.04);
  vec4 r = roughness * c0 + c1;
  float a004 = min(r.x * r.x, exp2(-9.28 * NoV)) * r.x + r.y;
  vec2 AB = vec2(-1.04, 1.04) * a004 + r.zw;
  return specular * AB.x + AB.y;
}

vec3 getSpecularDominantDir(const in vec3 N, const in vec3 R,
                            const in float realRoughness) {
  float smoothness = 1.0 - realRoughness;
  return mix(N, R, smoothness * (sqrt(smoothness) + realRoughness));
}

vec3 approximateSpecularIBL(const in vec3 specularColor, float rLinear,
                            const in vec3 N, const in vec3 V) {
  float NoV = clamp(dot(N, V), 0.0, 1.0);
  vec3 R = normalize((2.0 * NoV) * N - V);
  R = getSpecularDominantDir(N, R, rLinear);
  vec3 prefilteredColor = texturePanoramaLod(uIblTransform * R, rLinear);
  return prefilteredColor * integrateBRDFApprox(specularColor, rLinear, NoV);
}

// expect shCoefs uniform
// https://github.com/cedricpinson/envtools/blob/master/Cubemap.cpp#L523
vec3 sphericalHarmonics(const in vec3 N) {
  float x = N.x;
  float y = N.y;
  float z = -N.z;
  vec3 result = uSPH[0] + uSPH[1] * y + uSPH[2] * z + uSPH[3] * x +
                uSPH[4] * y * x + uSPH[5] * y * z +
                uSPH[6] * (3.0 * z * z - 1.0) + uSPH[7] * (z * x) +
                uSPH[8] * (x * x - y * y);
  return max(result, vec3(0.0));
}

vec3 computeIBL_UE4(const in vec3 N, const in vec3 V, const in vec3 albedo,
                    const in float roughness, const in vec3 specular) {
  vec3 color = albedo * sphericalHarmonics(uIblTransform * N);
  color += approximateSpecularIBL(specular, roughness, N, V);
  return color;
}

`;