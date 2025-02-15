document.addEventListener('DOMContentLoaded', () => {
    // 在文件开头添加滚动检测函数
    function checkScroll() {
        const sections = document.querySelectorAll('section');
        
        sections.forEach(section => {
            const sectionTop = section.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            
            if (sectionTop < windowHeight * 0.85) { // 当节点进入视口85%位置时
                section.classList.add('visible');
            }
        });
    }

    // 添加滚动监听
    window.addEventListener('scroll', checkScroll);
    // 初始检查
    checkScroll();

    const debug = document.getElementById('debug');
    const canvas = document.querySelector('.lp-SectionIntroWebGL-canvas');
    
    let robotGroup; // 声明在外部作用域

    try {
        if (!canvas) {
            throw new Error('Canvas not found');
        }
        if (!THREE) {
            throw new Error('THREE.js not loaded');
        }

        debug.textContent = 'Initializing...';
        
        const renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: true,
            antialias: true
        });

        // 确保渲染器创建成功
        if (!renderer) {
            throw new Error('Failed to create renderer');
        }

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        camera.position.z = 6; // 增加相机距离

        // 创建机器人
        robotGroup = new THREE.Group();

        // 头部（扁平椭球）
        const headGeometry = new THREE.SphereGeometry(1.3, 32, 32);
        const headMaterial = new THREE.MeshPhongMaterial({
            color: 0x1B1F24,
            emissive: 0x0969DA,
            emissiveIntensity: 0.15,
            shininess: 25
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.scale.set(1, 0.75, 0.9); // 更扁平的椭球形
        robotGroup.add(head);

        // 眼睛（改回圆形）
        const eyeGeometry = new THREE.CircleGeometry(0.25, 32); // 调整大小为0.25
        const eyeMaterial = new THREE.MeshPhongMaterial({
            color: 0x0969DA,
            emissive: 0x0969DA,
            emissiveIntensity: 1,
            side: THREE.DoubleSide
        });

        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.5, 0.1, 1.2);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.5, 0.1, 1.2);

        robotGroup.add(leftEye, rightEye);

        // 发光光环
        const ringCount = 3;
        const rings = new THREE.Group();
        
        for(let i = 0; i < ringCount; i++) {
            const ringGeometry = new THREE.TorusGeometry(1.5 + i * 0.1, 0.02, 16, 100);
            const ringMaterial = new THREE.MeshPhongMaterial({
                color: 0x0969DA,
                emissive: 0x0969DA,
                emissiveIntensity: 0.5,
                transparent: true,
                opacity: 0.3 - i * 0.1
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.rotation.x = Math.PI / 2;
            ring.position.y = 0.6;
            ring.position.z = -0.5 - i * 0.1;
            rings.add(ring);
        }
        robotGroup.add(rings);

        // 创建耳机组
        const headphoneGroup = new THREE.Group();

        // 耳机头带
        const headbandCurve = new THREE.EllipseCurve(
            0, 0,                 // 中心点
            1.5, 1.5,            // X和Y方向的半径
            Math.PI * 0.2,       // 起始角度
            Math.PI * 0.8,       // 结束角度
            false                 // 顺时针方向
        );
        
        const headbandPoints = headbandCurve.getPoints(50);
        const headbandGeometry = new THREE.BufferGeometry().setFromPoints(headbandPoints);
        const headbandMaterial = new THREE.LineBasicMaterial({ 
            color: 0x0969DA,
            linewidth: 2
        });
        
        // 创建头带管道
        const headbandTube = new THREE.TubeGeometry(
            new THREE.CatmullRomCurve3(
                headbandPoints.map(p => new THREE.Vector3(p.x, p.y, 0))
            ),
            50,    // 分段数
            0.05,  // 管道半径
            8,     // 管道截面分段数
            false  // 闭合路径
        );
        
        const headbandMesh = new THREE.Mesh(
            headbandTube,
            new THREE.MeshPhongMaterial({
                color: 0x1B1F24,
                emissive: 0x0969DA,
                emissiveIntensity: 0.2,
                shininess: 30
            })
        );
        headbandMesh.position.z = -0.2;
        headphoneGroup.add(headbandMesh);

        // 创建耳机罩
        const earpadGeometry = new THREE.TorusGeometry(0.3, 0.1, 16, 32);
        const earpadMaterial = new THREE.MeshPhongMaterial({
            color: 0x1B1F24,
            emissive: 0x0969DA,
            emissiveIntensity: 0.2,
            shininess: 30
        });

        // 左耳机罩
        const leftEarpad = new THREE.Mesh(earpadGeometry, earpadMaterial);
        leftEarpad.position.set(-1.4, 0, 0);
        leftEarpad.rotation.y = Math.PI / 2;

        // 右耳机罩
        const rightEarpad = new THREE.Mesh(earpadGeometry, earpadMaterial);
        rightEarpad.position.set(1.4, 0, 0);
        rightEarpad.rotation.y = Math.PI / 2;

        // 添加发光效果
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x0969DA,
            transparent: true,
            opacity: 0.3
        });

        const leftGlow = new THREE.Mesh(earpadGeometry, glowMaterial);
        leftGlow.position.copy(leftEarpad.position);
        leftGlow.rotation.copy(leftEarpad.rotation);
        leftGlow.scale.multiplyScalar(1.1);

        const rightGlow = new THREE.Mesh(earpadGeometry, glowMaterial);
        rightGlow.position.copy(rightEarpad.position);
        rightGlow.rotation.copy(rightEarpad.rotation);
        rightGlow.scale.multiplyScalar(1.1);

        headphoneGroup.add(leftEarpad, rightEarpad, leftGlow, rightGlow);
        robotGroup.add(headphoneGroup);

        // 动画状态变量
        let isAnimating = false;
        let animationProgress = 0;
        let currentAnimation = null;
        
        // 定义不同的动画类型
        const ANIMATIONS = {
            WINK_LEFT: 'winkLeft',
            WINK_RIGHT: 'winkRight',
            JUMP: 'jump',
        };
        
        function startRandomAnimation() {
            if (isAnimating) return;
            
            // 随机选择一个动画
            const animations = Object.values(ANIMATIONS);
            currentAnimation = animations[Math.floor(Math.random() * animations.length)];
            
            isAnimating = true;
            animationProgress = 0;
        }

        // 移除墨镜相关代码，直接将机器人组添加到场景
        scene.add(robotGroup);
        
        // 调整相机位置
        camera.position.z = 5; // 稍微调近一点

        // 调整相机位置使机器人大小更合适
        camera.position.z = 4.5;

        // 添加光源
        scene.add(new THREE.AmbientLight(0xffffff, 0.5));
        const pointLight = new THREE.PointLight(0x58a6ff, 1.5);
        pointLight.position.set(2, 2, 4);
        scene.add(pointLight);

        // 设置渲染器尺寸（保持不变）
        renderer.setSize(300, 300, false); // 增大画布尺寸
        renderer.setPixelRatio(window.devicePixelRatio);

        // 设置渲染器尺寸
        renderer.setSize(250, 250, false); // 稍微缩小画布尺寸

        function animate() {
            requestAnimationFrame(animate);
            
            // 光环动画
            rings.children.forEach((ring, index) => {
                ring.rotation.z += 0.002 * (index + 1);
                ring.scale.x = ring.scale.y = 1 + Math.sin(Date.now() * 0.001 + index) * 0.05;
            });
            
            const time = Date.now() * 0.001;
            
            if (isAnimating) {
                animationProgress += 0.02;
                
                switch(currentAnimation) {
                    case ANIMATIONS.WINK_LEFT:
                        // 左眼眨眼
                        leftEye.scale.y = Math.max(0.1, Math.sin(animationProgress * Math.PI));
                        if (animationProgress >= 1) {
                            leftEye.scale.y = 1;
                            isAnimating = false;
                        }
                        break;
                        
                    case ANIMATIONS.WINK_RIGHT:
                        // 右眼眨眼
                        rightEye.scale.y = Math.max(0.1, Math.sin(animationProgress * Math.PI));
                        if (animationProgress >= 1) {
                            rightEye.scale.y = 1;
                            isAnimating = false;
                        }
                        break;
                        
                    case ANIMATIONS.JUMP:
                        // 简化的跳跃动画，使用正弦函数
                        const jumpProgress = animationProgress * Math.PI; // 0 到 π
                        const maxHeight = 2.0; // 增加最大跳跃高度
                        
                        // 计算当前高度
                        const jumpHeight = Math.sin(jumpProgress) * maxHeight;
                        
                        // 根据高度设置压扁和拉伸效果
                        const verticalStretch = 1 + Math.sin(jumpProgress) * 0.2;
                        const horizontalSquash = 1 - Math.sin(jumpProgress) * 0.1;
                        
                        // 应用位置和形变
                        robotGroup.position.y = jumpHeight;
                        robotGroup.scale.y = verticalStretch;
                        robotGroup.scale.x = horizontalSquash;
                        robotGroup.scale.z = horizontalSquash;
                        
                        // 结束动画
                        if (animationProgress >= 1) {
                            robotGroup.position.y = 0;
                            robotGroup.scale.set(1, 1, 1);
                            isAnimating = false;
                        }
                        break;
                }
            } else {
                // 正常状态的随机眨眼
                const time = Date.now() * 0.001;
                const blink = Math.sin(time * 2) > 0.95;
                leftEye.scale.y = rightEye.scale.y = blink ? 0.1 : 1;
            }

            // 耳机发光效果动画
            const glowPulseHeadphone = Math.sin(Date.now() * 0.002) * 0.1 + 0.9;
            leftGlow.scale.set(1.1 * glowPulseHeadphone, 1.1 * glowPulseHeadphone, 1.1 * glowPulseHeadphone);
            rightGlow.scale.set(1.1 * glowPulseHeadphone, 1.1 * glowPulseHeadphone, 1.1 * glowPulseHeadphone);

            renderer.render(scene, camera);
        }

        animate();
        debug.textContent = 'Running...';

        // 修改点击事件监听器
        canvas.addEventListener('click', () => {
            startRandomAnimation();
        });

    } catch (error) {
        console.error('Error:', error);
        debug.textContent = `Error: ${error.message}`;
    }

    // 修改鼠标交互
    const mouseMove = (event) => {
        if (!robotGroup) return;
        
        const rect = canvas.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // 计算鼠标相对于元素中心的位置
        const mouseX = ((event.clientX - centerX) / (rect.width / 2));
        const mouseY = ((event.clientY - centerY) / (rect.height / 2));
        
        // 更平滑的旋转（移除isHappy判断）
        const rotationFactor = 0.15;
        const targetRotationY = mouseX * rotationFactor;
        const targetRotationX = -mouseY * (rotationFactor * 0.6);
        
        // 应用旋转
        robotGroup.rotation.y = targetRotationY;
        robotGroup.rotation.x = targetRotationX;
        
        // 眼睛跟随
        leftEye.position.x = -0.5 + mouseX * 0.05;
        rightEye.position.x = 0.5 + mouseX * 0.05;
        leftEye.position.y = 0.1 - mouseY * 0.05;
        rightEye.position.y = 0.1 - mouseY * 0.05;

        // 耳机组跟随头部旋转
        headphoneGroup.rotation.copy(robotGroup.rotation);
    };

    window.addEventListener('mousemove', mouseMove);
});