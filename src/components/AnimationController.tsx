interface AnimationControllerProps {
  onAnimationTrigger: (animationName: string) => void;
  onWriteClick?: () => void;
}

export const AnimationController = ({ onAnimationTrigger, onWriteClick }: AnimationControllerProps) => {
  // Buttons removed - component renders nothing
  return null;
};
