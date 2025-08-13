export class ComicShader {
    static fragment = `
        uniform sampler2D baseTexture;
        uniform sampler2D bloomTexture;
        uniform sampler2D overlayTexture;

        varying vec2 vUv;

        // Edge detection kernel (Sobel for outlines)
        float edgeDetection(vec2 uv) {
            vec2 texel = 1.0 / vec2(textureSize(baseTexture, 0));
            float gx = 0.0;
            gx += -1.0 * texture2D(baseTexture, uv + texel * vec2(-1, -1)).r;
            gx += -2.0 * texture2D(baseTexture, uv + texel * vec2(0, -1)).r;
            gx += -1.0 * texture2D(baseTexture, uv + texel * vec2(1, -1)).r;
            gx += 1.0 * texture2D(baseTexture, uv + texel * vec2(-1, 1)).r;
            gx += 2.0 * texture2D(baseTexture, uv + texel * vec2(0, 1)).r;
            gx += 1.0 * texture2D(baseTexture, uv + texel * vec2(1, 1)).r;

            float gy = 0.0;
            gy += -1.0 * texture2D(baseTexture, uv + texel * vec2(-1, -1)).r;
            gy += -2.0 * texture2D(baseTexture, uv + texel * vec2(-1, 0)).r;
            gy += -1.0 * texture2D(baseTexture, uv + texel * vec2(-1, 1)).r;
            gy += 1.0 * texture2D(baseTexture, uv + texel * vec2(1, -1)).r;
            gy += 2.0 * texture2D(baseTexture, uv + texel * vec2(1, 0)).r;
            gy += 1.0 * texture2D(baseTexture, uv + texel * vec2(1, 1)).r;

            return sqrt(gx * gx + gy * gy);
        }

        void main() {
            vec4 base = texture2D(baseTexture, vUv);
            vec4 bloom = texture2D(bloomTexture, vUv);
            vec4 overlay = texture2D(overlayTexture, vUv);

            vec4 color = base + bloom + 0.25 * overlay;

            // Light comic background: if dark, set to pale blue
            float luminance = dot(color.rgb, vec3(0.299, 0.587, 0.114));
            if (luminance < 0.1) { // Threshold for space/background
                color.rgb = vec3(0.8, 0.9, 1.0); // Light blue paper-like
            }

            // Choppy look: quantize to 2 levels for flat, clear separation (no 3D gradients)
            float levels = 2.0;
            color.rgb = floor(color.rgb * levels) / levels;

            // Black highlights/outlines: stronger edges for bold comic separation
            float edge = edgeDetection(vUv);
            if (edge > 0.05) { // Lower threshold for thicker lines
                color.rgb = vec3(0.0); // Pure black outlines
            }

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