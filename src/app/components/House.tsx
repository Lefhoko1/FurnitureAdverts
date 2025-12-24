import { useRef } from 'react';
import { Mesh } from 'three';

interface HouseProps {
  currentRoom: string;
}

export default function House({ currentRoom }: HouseProps) {
  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#e8dcc8" />
      </mesh>
      
      {/* Walls */}
      <Room name="living" position={[-6, 0, 0]} size={[8, 3, 8]} color="#f5ebe0" active={currentRoom === 'living'} />
      <Room name="bedroom" position={[6, 0, 0]} size={[8, 3, 8]} color="#f0e5d8" active={currentRoom === 'bedroom'} />
      <Room name="kitchen" position={[-6, 0, -10]} size={[8, 3, 6]} color="#f8f0e3" active={currentRoom === 'kitchen'} />
      <Room name="dining" position={[0, 0, -10]} size={[6, 3, 6]} color="#faf5ee" active={currentRoom === 'dining'} />
      <Room name="bathroom" position={[8, 0, -10]} size={[6, 3, 6]} color="#f3eae1" active={currentRoom === 'bathroom'} />
      <Room name="garage" position={[0, 0, 8]} size={[10, 3, 6]} color="#e6ddd2" active={currentRoom === 'garage'} />
    </group>
  );
}

interface RoomProps {
  name: string;
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  active: boolean;
}

function Room({ name, position, size, color, active }: RoomProps) {
  const [width, height, depth] = size;
  const wallOpacity = active ? 0.3 : 0.15;
  
  return (
    <group position={position}>
      {/* Back wall */}
      <mesh position={[0, height / 2, -depth / 2]} castShadow>
        <boxGeometry args={[width, height, 0.2]} />
        <meshStandardMaterial 
          color={color} 
          transparent 
          opacity={wallOpacity}
        />
      </mesh>
      
      {/* Left wall */}
      <mesh position={[-width / 2, height / 2, 0]} castShadow>
        <boxGeometry args={[0.2, height, depth]} />
        <meshStandardMaterial 
          color={color} 
          transparent 
          opacity={wallOpacity}
        />
      </mesh>
      
      {/* Right wall */}
      <mesh position={[width / 2, height / 2, 0]} castShadow>
        <boxGeometry args={[0.2, height, depth]} />
        <meshStandardMaterial 
          color={color} 
          transparent 
          opacity={wallOpacity}
        />
      </mesh>
      
      {/* Ceiling */}
      <mesh position={[0, height, 0]} receiveShadow>
        <boxGeometry args={[width, 0.1, depth]} />
        <meshStandardMaterial color={color} opacity={0.5} transparent />
      </mesh>
      
      {/* Room label above */}
      {active && (
        <group position={[0, height + 0.5, 0]}>
          <mesh>
            <boxGeometry args={[width * 0.6, 0.3, 0.05]} />
            <meshStandardMaterial color="#d4a574" />
          </mesh>
        </group>
      )}
    </group>
  );
}
