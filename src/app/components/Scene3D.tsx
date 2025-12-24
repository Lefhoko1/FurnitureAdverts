import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Sky } from '@react-three/drei';
import { Suspense } from 'react';
import House from './House';
import Products from './Products';

interface Scene3DProps {
  currentRoom: string;
  products: any[];
  selectedProduct: any | null;
  onProductSelect: (product: any) => void;
  autoTour: boolean;
}

export default function Scene3D({ 
  currentRoom, 
  products, 
  selectedProduct, 
  onProductSelect,
  autoTour 
}: Scene3DProps) {
  return (
    <div className="w-full h-full">
      <Canvas shadows>
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[0, 2, 8]} fov={60} />
          
          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[10, 20, 10]}
            intensity={1}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <pointLight position={[-10, 10, -10]} intensity={0.5} />
          
          {/* Environment */}
          <Sky sunPosition={[100, 20, 100]} />
          <Environment preset="apartment" />
          
          {/* House structure */}
          <House currentRoom={currentRoom} />
          
          {/* Products */}
          <Products
            products={products}
            currentRoom={currentRoom}
            selectedProduct={selectedProduct}
            onProductSelect={onProductSelect}
            autoTour={autoTour}
          />
          
          {/* Controls - constrained within house */}
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={2}
            maxDistance={15}
            maxPolarAngle={Math.PI / 2}
            minPolarAngle={Math.PI / 6}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}