

export const LambertVertex = /* glsl */`


    varying vec3 vNormal;
    varying vec2 vUv;

    void main() {

        mat3 m3 = mat3( instanceMatrix );
        vNormal = normalize( normalMatrix * m3 * normal );

        vUv = uv;
        vec3 pos = position;

        pos = (instanceMatrix*vec4(pos, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }

`;


export const LambertFragment = /* glsl */`
    precision highp float;

    uniform sampler2D map;          
    uniform vec3      lightDir;     
    uniform vec3      lightColor;   

    uniform vec3      ambientColor;

    varying vec3 vNormal;
    varying vec2 vUv;

    void main() {

        float NdotL = max( dot( vNormal, lightDir ), 0.0 );
        vec3 diffuse = lightColor * NdotL;

        vec4 tex = texture2D( map, vUv );

        vec3 color = tex.rgb * ( ambientColor + diffuse )*0.8;

        gl_FragColor = vec4( color, tex.a );
    }
        
`;