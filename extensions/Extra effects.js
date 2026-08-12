// Name: Extra Effects
// ID: ExtraEffects
// Description: Advanced shader effects extension for scratch, big thanks to ObviousAlexC for system shaders for this extension
// By: katboizz <https://scratch.mit.edu/users/katboizz/>

(function (Scratch) {
  "use strict";

  if (!Scratch.extensions.unsandboxed) {
    throw new Error("Require unsandboxed extension");
  }

  const vm = Scratch.vm;
  const runtime = vm.runtime;
  const renderer = runtime.renderer;
  const gl = renderer._gl;
  const twgl = renderer.exports.twgl;
  const shaderManager = renderer._shaderManager;

  const vertex = `precision mediump float;

uniform mat4 u_projectionMatrix;
uniform mat4 u_modelMatrix;

uniform float u_skewX;
uniform float u_skewY;

uniform float u_waveAmpX;
uniform float u_waveAmpY;

uniform bool u_repeat;

uniform float u_flipX;
uniform float u_flipY;
uniform float u_flipZ;

attribute vec2 a_texCoord;
attribute vec2 a_position;

varying vec2 v_texCoord;

void main() {
    gl_Position = vec4(a_position, 0, 0);
    v_texCoord = a_texCoord;

    if ((u_waveAmpX != 0.0 || u_waveAmpY != 0.0) && !u_repeat) {
        float highest = u_waveAmpX;
        if (u_waveAmpY > highest) { highest = u_waveAmpY; }
        highest = abs(highest * 2.0) + 1.0;

        gl_Position.xyz *= highest;
        v_texCoord = ((v_texCoord - 0.5) * highest) + 0.5;
    }

    if (u_skewX != 0.0 || u_skewY != 0.0) {
        gl_Position = mat4(
            1, u_skewY / 100.0, 0, 0,
            u_skewX / 100.0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ) * gl_Position;
    }

    if (u_flipX != 0.0 || u_flipY != 0.0) {
        mat4 mulMat = mat4(
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        );

        if (u_flipX != 0.0) {
            float radians = u_flipX / 31.8309526858;
            mulMat = mat4(
                cos(radians), 0, 0, sin(radians),
                0, 1, 0, 0,
                0, 0, 1, 0,
                sin(radians), 0, 0, cos(radians)
            ) * mulMat;
        }

        if (u_flipY != 0.0) {
            float radians = u_flipY / 31.8309526858;
            mulMat = mat4(
                1, 0, 0, 0,
                0, cos(radians), 0, sin(radians),
                0, 0, 1, 0,
                0, sin(radians), 0, cos(radians)
            ) * mulMat;
        }

        gl_Position = gl_Position * mulMat;
    }

    gl_Position.w = (gl_Position.w * u_flipZ * 0.01) + 1.0;
    gl_Position = u_projectionMatrix * u_modelMatrix * gl_Position;
}`;

  const fragment = `precision mediump float;

varying vec2 v_texCoord;
uniform sampler2D u_skin;
uniform vec2 u_skinSize;

uniform float u_color;
uniform float u_brightness;
uniform float u_fisheye;
uniform float u_whirl;
uniform float u_pixelate;
uniform float u_mosaic;
uniform float u_ghost;

uniform float u_saturation;
uniform float u_posterize;
uniform float u_contrast;
uniform float u_sepia;
uniform float u_chromatic;

uniform float u_red_e;
uniform float u_green_e;
uniform float u_blue_e;

uniform float u_unfocus;
uniform lowp int u_blur;

uniform bool u_oldColor;
uniform bool u_repeat;
uniform bool u_stretchyWaves;

uniform float u_jumbleX;
uniform float u_jumbleY;
uniform float u_jumbleSeed;

uniform float u_waveAmpX;
uniform float u_waveAmpY;
uniform float u_waveSizeX;
uniform float u_waveSizeY;
uniform float u_time;

uniform float u_glow;
uniform float u_invert;
uniform float u_glitch;
uniform float u_glitchX;
uniform float u_glitchY;
uniform float u_outline;
uniform float u_neon;

const float epsilon = 1e-3;
const vec2 kCenter = vec2(0.5, 0.5);

vec3 convertRGB2HSV(vec3 rgb) {
    const vec4 hueOffsets = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 temp1 = rgb.b > rgb.g ? vec4(rgb.bg, hueOffsets.wz) : vec4(rgb.gb, hueOffsets.xy);
    vec4 temp2 = rgb.r > temp1.x ? vec4(rgb.r, temp1.yzx) : vec4(temp1.xyw, rgb.r);
    float m = min(temp2.y, temp2.w);
    float C = temp2.x - m;
    float V = temp2.x;
    return vec3(
        abs(temp2.z + (temp2.w - temp2.y) / (6.0 * C + epsilon)),
        C / (temp2.x + epsilon),
        V);
}

vec3 convertHue2RGB(float hue) {
    float r = abs(hue * 6.0 - 3.0) - 1.0;
    float g = 2.0 - abs(hue * 6.0 - 2.0);
    float b = 2.0 - abs(hue * 6.0 - 4.0);
    return clamp(vec3(r, g, b), 0.0, 1.0);
}

vec3 convertHSV2RGB(vec3 hsv) {
    vec3 rgb = convertHue2RGB(hsv.x);
    float c = hsv.z * hsv.y;
    return rgb * c + hsv.z - c;
}

highp vec4 daveRandomRange(float lowR, float highR, vec2 coordinates) {
    lowp float r = (coordinates.x * 50.25313532) + (coordinates.y * 21.5453) + u_jumbleSeed;
    highp float randomizer = r * r / u_jumbleSeed / 5398932.234523;
    return mod(vec4(
        fract(sin(mod(randomizer * (91.3458), 1440.0)) * 47453.5453),
        fract(sin(mod(randomizer * (80.3458), 1440.0)) * 48456.5453),
        fract(sin(mod(randomizer * (95.3458), 1440.0)) * 42457.5453),
        fract(sin(mod(randomizer * (85.3458), 1440.0)) * 47553.5453)
    ) - lowR, highR - lowR);
}

void main() {
    vec2 texcoord0 = v_texCoord;
    float glitch = u_glitch / 60.0;
    float outline = u_outline / 100.0;
    float neon = u_neon / 40.0;
    float gX = u_glitchX / 60.0;
    float gY = u_glitchY / 60.0;
    float px = 1.0 / u_skinSize.x;
    float py = 1.0 / u_skinSize.y;

    // Glitch coordinates
    float gx = floor(texcoord0.y * 50.0);
    texcoord0.x += (daveRandomRange(0.0, 1.0, vec2(gx, u_time)).x - 0.5) * 0.28 * gX;

    float gy = floor(texcoord0.x * 50.0);
    texcoord0.y += (daveRandomRange(0.0, 1.0, vec2(gy, u_time + 9.0)).x - 0.5) * 0.28 * gY;

    float line = floor(texcoord0.y * 80.0);
    texcoord0.x += (daveRandomRange(0.0, 1.0, vec2(line, u_time)).x - 0.5) * 0.35 * glitch;

    // Waves
    if (u_waveAmpX != 0.0) {
        if (u_stretchyWaves) { texcoord0.x += sin(u_time + texcoord0.x * u_waveSizeX) * u_waveAmpX; }
        else { texcoord0.y += sin(u_time + texcoord0.x * u_waveSizeX) * u_waveAmpX; }
    }
    if (u_waveAmpY != 0.0) {
        if (u_stretchyWaves) { texcoord0.y += sin(u_time + texcoord0.y * u_waveSizeY) * u_waveAmpY; }
        else { texcoord0.x += sin(u_time + texcoord0.y * u_waveSizeY) * u_waveAmpY; }
    }

    // Jumble
    if (u_jumbleX != 0.0 || u_jumbleY != 0.0) {
        vec2 costumePixel = floor(texcoord0 * u_skinSize);
        vec4 jumbleCoords = daveRandomRange(0.0, 1.0, costumePixel);
        vec2 offsets = vec2(u_jumbleX / 100.0, u_jumbleY / 100.0);

        texcoord0.x = mix(texcoord0.x, jumbleCoords.x, offsets.x);
        texcoord0.y = mix(texcoord0.y, jumbleCoords.y, offsets.y);
    }

    if (!u_repeat && (texcoord0.x < 0.0 || texcoord0.y < 0.0 || texcoord0.x > 1.0 || texcoord0.y > 1.0)) { discard; }

    // Mosaic + Pixelate
    texcoord0 = fract(u_mosaic * texcoord0);
    if (u_pixelate > 0.0) {
        vec2 pixelTexelSize = u_skinSize / u_pixelate;
        texcoord0 = (floor(texcoord0 * pixelTexelSize) + kCenter) / pixelTexelSize;
    }

    // Whirl
    if (u_whirl != 0.0) {
        const float kRadius = 0.5;
        vec2 offset = texcoord0 - kCenter;
        float offsetMagnitude = length(offset);
        float whirlFactor = max(1.0 - (offsetMagnitude / kRadius), 0.0);
        float whirlActual = u_whirl * whirlFactor * whirlFactor;
        float sinWhirl = sin(whirlActual);
        float cosWhirl = cos(whirlActual);
        mat2 rotationMatrix = mat2(
            cosWhirl, -sinWhirl,
            sinWhirl, cosWhirl
        );
        texcoord0 = rotationMatrix * offset + kCenter;
    }

    // Fisheye
    if (u_fisheye != 0.0) {
        vec2 vecC = (texcoord0 - kCenter) / kCenter;
        float vecLength = length(vecC);
        float r = pow(min(vecLength, 1.0), u_fisheye) * max(1.0, vecLength);
        vec2 unitV = vecC / vecLength;
        texcoord0 = kCenter + r * unitV * kCenter;
    }

    // Fetch Base Texture
    vec4 base = texture2D(u_skin, texcoord0);

    // Neon
    base.rgb += vec3(0.0, 1.5, 2.2) * base.a * neon * 3.0;

    // Outline
    float a = base.a;
    float e = 0.0;

    for (float i = 1.0; i <= 4.0; i += 1.0) {
        e += texture2D(u_skin, texcoord0 + vec2(px*i, 0)).a;
        e += texture2D(u_skin, texcoord0 - vec2(px*i, 0)).a;
        e += texture2D(u_skin, texcoord0 + vec2(0, py*i)).a;
        e += texture2D(u_skin, texcoord0 - vec2(0, py*i)).a;
    }

    for (float i = 2.0; i <= 4.0; i += 1.0) {
        e += texture2D(u_skin, texcoord0 + vec2(px*i, py*i)).a;
        e += texture2D(u_skin, texcoord0 + vec2(-px*i, py*i)).a;
        e += texture2D(u_skin, texcoord0 + vec2(px*i, -py*i)).a;
        e += texture2D(u_skin, texcoord0 + vec2(-px*i, -py*i)).a;
    }

    e = step(0.01, e) * (1.0 - a);
    base.rgb = mix(base.rgb, vec3(0.0), e * outline * 4.0);

    gl_FragColor = base;

    // Glow
    if (u_glow > 0.0) {
        vec2 texel = 1.0 / u_skinSize;
        float radiusPx = max((u_glow / 100.0) * 14.0, 1.0);

        float glowAlpha = 0.0;
        vec3 colorAccum = vec3(0.0);
        float totalWeight = 0.0;

        const int RINGS = 3;
        const int SAMPLES = 12;
        for (int ring = 1; ring <= RINGS; ring++) {
            float ringRadius = radiusPx * (float(ring) / float(RINGS));
            float weight = 1.0 / float(ring);
            for (int i = 0; i < SAMPLES; i++) {
                float angle = (float(i) / float(SAMPLES)) * 6.28318530718;
                vec2 offset = vec2(cos(angle), sin(angle)) * ringRadius * texel;
                vec4 sampleColor = texture2D(u_skin, texcoord0 + offset);
                glowAlpha += sampleColor.a * weight;
                colorAccum += sampleColor.rgb * weight;
                totalWeight += weight;
            }
        }
        glowAlpha = clamp((glowAlpha / totalWeight) * 1.8, 0.0, 1.0);

        float alphaSum = glowAlpha > 0.0 ? (glowAlpha * totalWeight) : 0.0001;
        vec3 glowColor = (glowAlpha > 0.001) ? clamp(colorAccum / max(alphaSum / 1.8, 0.0001), 0.0, 1.0) : vec3(1.0, 0.8, 0.2);

        float outside = 1.0 - gl_FragColor.a;
        gl_FragColor.rgb += glowColor * glowAlpha * outside;
        gl_FragColor.a = max(gl_FragColor.a, glowAlpha * outside);
        gl_FragColor.rgb = min(gl_FragColor.rgb, vec3(1.0));
    }

    // Chromatic Aberration
    if (u_chromatic > 0.0) {
        vec4 left = texture2D(u_skin, texcoord0 - vec2(u_chromatic / 800.0, 0));
        vec4 right = texture2D(u_skin, texcoord0 + vec2(u_chromatic / 800.0, 0));

        gl_FragColor.xyz = vec3(left.x, gl_FragColor.y, right.z);
        gl_FragColor.w = (left.w + gl_FragColor.w + right.w) * 0.33333;
    }

    // Unfocus
    if (u_unfocus > 0.0) {
        float blurDist = u_unfocus / 1000.0;
        for (int i = 0; i < 4; i++) {
            float curDist = blurDist * float(i);
            gl_FragColor += texture2D(u_skin, texcoord0 + vec2(0, curDist));
            gl_FragColor += texture2D(u_skin, texcoord0 + vec2(0, -curDist));
            gl_FragColor += texture2D(u_skin, texcoord0 + vec2(curDist, 0));
            gl_FragColor += texture2D(u_skin, texcoord0 + vec2(-curDist, 0));

            gl_FragColor += texture2D(u_skin, texcoord0 + vec2(curDist, curDist));
            gl_FragColor += texture2D(u_skin, texcoord0 + vec2(curDist, -curDist));
            gl_FragColor += texture2D(u_skin, texcoord0 + vec2(-curDist, -curDist));
            gl_FragColor += texture2D(u_skin, texcoord0 + vec2(-curDist, curDist));
        }
        gl_FragColor /= 33.0;
    }

    // Blur
    if (u_blur > 0) {
        vec2 pixelTexelSize = 1.0 / u_skinSize;
        float divider = 1.0;
        float unfocused = 1.0;
        if (u_unfocus > 0.0) { unfocused = 1.0 / u_unfocus; }

        float dividerStep = 8.0 * unfocused;

        for (int i = 0; i < 128; i++) {
            if (i >= u_blur) { break; }

            vec2 blurStep = pixelTexelSize * float(i);

            gl_FragColor += texture2D(u_skin, texcoord0 + vec2(0, blurStep.y)) * unfocused;
            gl_FragColor += texture2D(u_skin, texcoord0 + vec2(0, -blurStep.y)) * unfocused;
            gl_FragColor += texture2D(u_skin, texcoord0 + vec2(blurStep.x, 0)) * unfocused;
            gl_FragColor += texture2D(u_skin, texcoord0 + vec2(-blurStep.x, 0)) * unfocused;

            gl_FragColor += texture2D(u_skin, texcoord0 + vec2(blurStep.x, blurStep.y)) * unfocused;
            gl_FragColor += texture2D(u_skin, texcoord0 + vec2(blurStep.x, -blurStep.y)) * unfocused;
            gl_FragColor += texture2D(u_skin, texcoord0 + vec2(-blurStep.x, -blurStep.y)) * unfocused;
            gl_FragColor += texture2D(u_skin, texcoord0 + vec2(-blurStep.x, blurStep.y)) * unfocused;

            divider += dividerStep;
        }
        gl_FragColor /= divider;
    }

    gl_FragColor.rgb = clamp(gl_FragColor.rgb / (gl_FragColor.a + epsilon), 0.0, 1.0);
    gl_FragColor.rgb *= vec3(u_red_e / 100.0, u_green_e / 100.0, u_blue_e / 100.0);

    // Color
    if (u_color != 0.0) {
        vec3 hsv = convertRGB2HSV(gl_FragColor.xyz);

        if (u_oldColor) {
            const float minLightness = 0.11 / 2.0;
            const float minSaturation = 0.09;
            if (hsv.z < minLightness) hsv = vec3(0.0, 1.0, minLightness);
            else if (hsv.y < minSaturation) hsv = vec3(0.0, minSaturation, hsv.z);
        }

        hsv.x = mod(hsv.x + u_color, 1.0);
        if (hsv.x < 0.0) hsv.x += 1.0;

        gl_FragColor.rgb = convertHSV2RGB(hsv);
    }

    // Saturation
    if (u_saturation != 0.0) {
        vec3 hsv = convertRGB2HSV(gl_FragColor.xyz);
        hsv.y += u_saturation / 100.0;
        gl_FragColor.rgb = convertHSV2RGB(hsv);
    }

    // Brightness
    if (u_brightness != 0.0) {
        if (u_oldColor) {
            gl_FragColor.rgb = clamp(gl_FragColor.rgb + vec3(u_brightness), vec3(0), vec3(1));
        } else {
            vec3 hsv = convertRGB2HSV(gl_FragColor.xyz);
            hsv.z += u_brightness;
            gl_FragColor.rgb = convertHSV2RGB(hsv);
        }
    }

    // Posterize
    if (u_posterize != 100.0) {
        vec3 hsv = convertRGB2HSV(gl_FragColor.xyz);
        float blend = 1.0 / u_posterize;
        hsv.y = ceil(hsv.y * u_posterize) * blend;
        hsv.z = ceil(hsv.z * u_posterize) * blend;
        gl_FragColor.xyz = convertHSV2RGB(hsv);
    }

    // Contrast
    if (u_contrast != 100.0) {
        gl_FragColor.rgb = (gl_FragColor.rgb - 0.5) * (u_contrast / 100.0) + 0.5;
    }

    // Sepia
    if (u_sepia >= 0.0) {
        float brightest = gl_FragColor.x;
        if (gl_FragColor.y > brightest) { brightest = gl_FragColor.y; }
        if (gl_FragColor.z > brightest) { brightest = gl_FragColor.z; }
        gl_FragColor.xyz = mix(gl_FragColor.xyz, vec3(brightest, brightest * 0.75, brightest * 0.5), u_sepia / 100.0);
    }

    // Invert
    if (u_invert > 0.0) {
        vec3 inverted = vec3(1.0) - gl_FragColor.rgb;
        gl_FragColor.rgb = mix(gl_FragColor.rgb, inverted, u_invert / 100.0);
    }

    // Premultiply alpha
    gl_FragColor.rgb *= gl_FragColor.a + epsilon;

    // Ghost
    gl_FragColor *= u_ghost;
}`;

  let instance;

  class ExtraEffectsExtension {

    defaultEffects = {
      u_color: "color",
      u_fisheye: "fisheye",
      u_whirl: "whirl",
      u_pixelate: "pixelate",
      u_mosaic: "mosaic",
      u_brightness: "brightness",
      u_ghost: "ghost",
    };

    defaultValues = {
      u_saturation: 0,
      u_posterize: 100,
      u_contrast: 100,
      u_chromatic: 0,
      u_sepia: 0,
      u_red_e: 100,
      u_green_e: 100,
      u_blue_e: 100,

      u_waveAmpX: 0,
      u_waveAmpY: 0,
      u_waveSizeX: 3.1415962,
      u_waveSizeY: 3.1415962,
      u_time: 0,

      u_jumbleX: 0,
      u_jumbleY: 0,
      u_jumbleSeed: 1,

      u_blur: 0,
      u_unfocus: 0,

      u_skewX: 0,
      u_skewY: 0,

      u_flipX: 0,
      u_flipY: 0,
      u_flipZ: 0,

      u_glow: 0,
      u_invert: 0,
      u_glitch: 0,
      u_glitchX: 0,
      u_glitchY: 0,
      u_outline: 0,
      u_neon: 0,

      u_oldColor: true,
      u_repeat: false,
      u_stretchyWaves: false,
    };

    maxRanges = {
      u_saturation: [-100, 100],
      u_posterize: [1, 100],
      u_contrast: [0, 200],
      u_chromatic: [0, 100],
      u_sepia: [0, 100],
      u_red_e: [0, 100],
      u_green_e: [0, 100],
      u_blue_e: [0, 100],

      u_waveAmpX: [-Infinity, Infinity],
      u_waveAmpY: [-Infinity, Infinity],
      u_waveSizeX: [-Infinity, Infinity],
      u_waveSizeY: [-Infinity, Infinity],
      u_time: [-Infinity, Infinity],

      u_jumbleX: [-100, 100],
      u_jumbleY: [-100, 100],
      u_jumbleSeed: [1, Infinity],

      u_blur: [0, 128],
      u_unfocus: [0, 100],

      u_skewX: [-100, 100],
      u_skewY: [-100, 100],
      u_flipX: [-Infinity, Infinity],
      u_flipY: [-Infinity, Infinity],
      u_flipZ: [-Infinity, Infinity],

      u_glow: [0, 1000],
      u_invert: [0, 100],
      u_glitch: [0, 100],
      u_glitchX: [0, 100],
      u_glitchY: [0, 100],
      u_outline: [0, 100],
      u_neon: [0, 100],
    };

    constructor() {
      this.newShader = twgl.createProgramInfo(gl, [vertex, fragment]);

      const oldGetShader = shaderManager.getShader;
      shaderManager.getShader = (mode, effectBits) => {
        if (mode !== "default") return oldGetShader.call(shaderManager, mode, effectBits);
        return this.newShader;
      };

      runtime.on("targetWasCreated", (target) => {
        const drawable = renderer._allDrawables[target.drawableID];
        if (!drawable) return;

        if (target.isOriginal) {
          drawable._uniforms = {
            ...drawable._uniforms,
            ...this.defaultValues
          };
        } else if (target.sprite.clones[0]) {
          const sourceDrawable = renderer._allDrawables[target.sprite.clones[0].drawableID];
          if (sourceDrawable) {
            drawable._uniforms = { ...sourceDrawable._uniforms };
          }
        }
      });

      runtime.on("PROJECT_START", () => this.resetAll());
      runtime.on("PROJECT_LOADED", () => this.resetAll());
    }

    resetAll() {
      for (let i = 0; i < runtime.targets.length; i++) {
        const target = runtime.targets[i];
        this.clearEffects({}, { target });
      }
    }

    getInfo() {
      return {
        id: "ExtraEffects",
        name: "Extra effects",
        color1: '#00beaf',
        color2: '#009689',
        blocks: [
          {
            opcode: "setEffectValue",
            blockType: Scratch.BlockType.COMMAND,
            text: "set effect [EFFECT] by [VALUE]",
            arguments: {
              EFFECT: { menu: "effectsMenu", defaultValue: "u_glow" },
              VALUE: { type: Scratch.ArgumentType.NUMBER, defaultValue: 50 }
            }
          },
          {
            opcode: "changeEffectValue",
            blockType: Scratch.BlockType.COMMAND,
            text: "Change effect [EFFECT] by [VALUE]",
            arguments: {
              EFFECT: { menu: "effectsMenu", defaultValue: "u_glow" },
              VALUE: { type: Scratch.ArgumentType.NUMBER, defaultValue: 10 }
            }
          },
          "---",
          {
            opcode: "setOptionValue",
            blockType: Scratch.BlockType.COMMAND,
            text: "set [OPTION] effect to [VALUE]",
            arguments: {
              OPTION: { menu: "optionsMenu", defaultValue: "u_repeat" },
              VALUE: { menu: "booleanMenu", defaultValue: "true" }
            }
          },
          "---",
          {
            opcode: "clearEffects",
            blockType: Scratch.BlockType.COMMAND,
            text: "clear all effect",
            arguments: {}
          }
        ],
        menus: {
          effectsMenu: {
            items: [
              { text: "color", value: "u_color" },
              { text: "brightness", value: "u_brightness" },
              { text: "fisheye", value: "u_fisheye" },
              { text: "whirl", value: "u_whirl" },
              { text: "pixelate", value: "u_pixelate" },
              { text: "mosaic", value: "u_mosaic" },
              { text: "ghost", value: "u_ghost" },
              { text: "saturation", value: "u_saturation" },
              { text: "posterize", value: "u_posterize" },
              { text: "contrast", value: "u_contrast" },
              { text: "sepia", value: "u_sepia" },
              { text: "chromatic aberration", value: "u_chromatic" },
              { text: "red amount", value: "u_red_e" },
              { text: "green amount", value: "u_green_e" },
              { text: "blue amount", value: "u_blue_e" },
              { text: "blur", value: "u_blur" },
              { text: "unfocus", value: "u_unfocus" },
              { text: "wave amplitude y", value: "u_waveAmpX" },
              { text: "wave amplitude x", value: "u_waveAmpY" },
              { text: "wave size y", value: "u_waveSizeX" },
              { text: "wave size x", value: "u_waveSizeY" },
              { text: "animation effect time", value: "u_time" },
              { text: "jumble x", value: "u_jumbleX" },
              { text: "jumble y", value: "u_jumbleY" },
              { text: "jumble seed", value: "u_jumbleSeed" },
              { text: "skew x", value: "u_skewX" },
              { text: "skew y", value: "u_skewY" },
              { text: "flip x", value: "u_flipX" },
              { text: "flip y", value: "u_flipY" },
              { text: "flip depth", value: "u_flipZ" },
              { text: "Glow", value: "u_glow" },
              { text: "Invert", value: "u_invert" },
              { text: "glitch", value: "u_glitch" },
              { text: "glitch x", value: "u_glitchX" },
              { text: "glitch y", value: "u_glitchY" },
              { text: "outline", value: "u_outline" },
              { text: "neon", value: "u_neon" }
            ],
            acceptReporters: true
          },
          optionsMenu: {
            items: [
              { text: "use old color functions", value: "u_oldColor" },
              { text: "repeat costume", value: "u_repeat" },
              { text: "stretchy waves", value: "u_stretchyWaves" }
            ],
            acceptReporters: true
          },
          booleanMenu: {
            items: ["true", "false"],
            acceptReporters: true
          }
        }
      };
    }

    setEffectValue({ EFFECT, VALUE }, { target }) {
      const defaultEffect = this.defaultEffects[EFFECT];
      if (defaultEffect) {
        target.setEffect(defaultEffect, Scratch.Cast.toNumber(VALUE));
        return;
      }
      if (typeof this.defaultValues[EFFECT] === "boolean") return;

      const drawable = renderer._allDrawables[target.drawableID];
      if (drawable && drawable._uniforms) {
        drawable._uniforms[EFFECT] = Scratch.Cast.toNumber(VALUE);
        this._clampUniform(drawable, EFFECT);
        vm.renderer.dirty = true;
      }
    }

    changeEffectValue({ EFFECT, VALUE }, { target }) {
      const defaultEffect = this.defaultEffects[EFFECT];
      if (defaultEffect) {
        target.setEffect(defaultEffect, (target.effects[defaultEffect] || 0) + Scratch.Cast.toNumber(VALUE));
        return;
      }
      if (typeof this.defaultValues[EFFECT] === "boolean") return;

      const drawable = renderer._allDrawables[target.drawableID];
      if (drawable && drawable._uniforms) {
        const current = drawable._uniforms[EFFECT] || 0;
        drawable._uniforms[EFFECT] = current + Scratch.Cast.toNumber(VALUE);
        this._clampUniform(drawable, EFFECT);
        vm.renderer.dirty = true;
      }
    }

    _clampUniform(drawable, key) {
      const range = this.maxRanges[key];
      if (!range || !runtime.runtimeOptions || !runtime.runtimeOptions.miscLimits) return;
      drawable._uniforms[key] = Math.min(Math.max(drawable._uniforms[key], range[0]), range[1]);
    }

    setOptionValue({ OPTION, VALUE }, { target }) {
      if (this.defaultEffects[OPTION]) return;
      if (typeof this.defaultValues[OPTION] !== "boolean") return;

      const drawable = renderer._allDrawables[target.drawableID];
      if (drawable && drawable._uniforms) {
        drawable._uniforms[OPTION] = Scratch.Cast.toBoolean(VALUE);
        vm.renderer.dirty = true;
      }
    }

    clearEffects(args, { target }) {
      target.clearEffects();
      const drawable = renderer._allDrawables[target.drawableID];
      if (drawable) {
        drawable._uniforms = {
          ...drawable._uniforms,
          ...this.defaultValues
        };
        vm.renderer.dirty = true;
      }
    }
  }

  instance = new ExtraEffectsExtension();
  Scratch.extensions.register(instance);
})(Scratch);