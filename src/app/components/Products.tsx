import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface ProductsProps {
  products: any[];
  currentRoom: string;
  selectedProduct: any | null;
  onProductSelect: (product: any) => void;
  autoTour: boolean;
}

export default function Products({ 
  products, 
  currentRoom, 
  selectedProduct, 
  onProductSelect,
  autoTour 
}: ProductsProps) {
  const [currentAutoIndex, setCurrentAutoIndex] = useState(0);
  
  // Auto tour logic
  useEffect(() => {
    if (!autoTour) return;
    
    const roomProducts = products.filter(p => p.room === currentRoom);
    if (roomProducts.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentAutoIndex((prev) => {
        const next = (prev + 1) % roomProducts.length;
        onProductSelect(roomProducts[next]);
        return next;
      });
    }, 5000); // Change product every 5 seconds
    
    return () => clearInterval(interval);
  }, [autoTour, products, currentRoom, onProductSelect]);
  
  const roomProducts = products.filter(p => p.room === currentRoom);
  
  // Room position mappings
  const roomPositions: Record<string, [number, number, number]> = {
    living: [-6, 0, 0],
    bedroom: [6, 0, 0],
    kitchen: [-6, 0, -10],
    dining: [0, 0, -10],
    bathroom: [8, 0, -10],
    garage: [0, 0, 8],
  };
  
  const basePosition = roomPositions[currentRoom] || [0, 0, 0];
  
  return (
    <group>
      {roomProducts.map((product, index) => {
        const offset = index * 2 - (roomProducts.length * 2) / 2;
        const position: [number, number, number] = [
          basePosition[0] + offset,
          basePosition[1] + 0.5,
          basePosition[2] + 2
        ];
        
        return (
          <Product
            key={product.id}
            product={product}
            position={position}
            isSelected={selectedProduct?.id === product.id}
            onClick={() => onProductSelect(product)}
          />
        );
      })}
    </group>
  );
}

interface ProductProps {
  product: any;
  position: [number, number, number];
  isSelected: boolean;
  onClick: () => void;
}

function Product({ product, position, isSelected, onClick }: ProductProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  // Rotation animation for selected product
  useFrame((state, delta) => {
    if (meshRef.current && isSelected) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });
  
  // Change cursor on hover
  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto';
  }, [hovered]);
  
  // Placeholder 3D model - in production, you'd load the actual 3D model here
  const scale = isSelected ? 1.3 : 1;
  const color = isSelected ? '#d4a574' : product.color || '#8b7355';
  
  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
        }}
        castShadow
        scale={scale}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial 
          color={color} 
          metalness={0.3} 
          roughness={0.7}
          emissive={isSelected ? '#d4a574' : '#000000'}
          emissiveIntensity={isSelected ? 0.3 : 0}
        />
      </mesh>
      
      {/* Product name label */}
      {isSelected && (
        <Text
          position={[0, 1.5, 0]}
          fontSize={0.2}
          color="#2c2825"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#ffffff"
        >
          {product.name}
        </Text>
      )}
      
      {/* Highlight ring */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
          <ringGeometry args={[0.7, 0.9, 32]} />
          <meshBasicMaterial color="#d4a574" transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  );
}
