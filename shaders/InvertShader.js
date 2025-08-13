export class InvertShader {
    static fragment = `
        uniform sampler2D baseTexture;
        uniform sampler2D bloomTexture;
        uniform sampler2D overlayTexture;

        varying vec2 vUv;

        void main() {
            vec4 base = texture2D(baseTexture, vUv);
            vec4 bloom = texture2D(bloomTexture, vUv);
            vec4 overlay = texture2D(overlayTexture, vUv);

            vec4 color = base + bloom + 0.25 * overlay;

            // Invert colors for fun, recognizable effect
            color.rgb = 1.0 - color.rgb;

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