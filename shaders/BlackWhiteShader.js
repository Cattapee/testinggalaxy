export class BlackWhiteShader {
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

            // Black & white: full grayscale
            float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
            color.rgb = vec3(gray, gray, gray);

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