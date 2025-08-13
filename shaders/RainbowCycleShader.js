export class RainbowCycleShader {
    static fragment = `
        uniform sampler2D baseTexture;
        uniform sampler2D bloomTexture;
        uniform sampler2D overlayTexture;
        uniform float time; // Add uniform time in ShaderMaterial when creating ShaderPass

        varying vec2 vUv;

        void main() {
            vec4 base = texture2D(baseTexture, vUv);
            vec4 bloom = texture2D(bloomTexture, vUv);
            vec4 overlay = texture2D(overlayTexture, vUv);

            vec4 color = base + bloom + 0.25 * overlay;

            // Rainbow cycle: shift hues over time for fun animation
            float hue = mod(time * 0.5 + length(color.rgb), 6.28); // Cycle speed
            float r = abs(mod(hue, 2.0) - 1.0);
            float g = abs(mod(hue + 4.188, 2.0) - 1.0);
            float b = abs(mod(hue + 2.094, 2.0) - 1.0);
            color.rgb *= vec3(r, g, b); // Multiply for rainbow tint

            gl_FragColor = color;
        }
    `;

    static vertex = `
        varying vec2 vUv;

        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;
}