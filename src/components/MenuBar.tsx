import { useGame } from '../contexts/GameContext';

export const MenuBar = () => {
  const menuItems = ['File', 'Edit', 'View', 'Insert', 'Help'];
  const { errorCount, triggerCrash } = useGame();

  const handleSubmit = () => {
    if (errorCount > 0) {
      triggerCrash();
    }
  };

  return (
    <div className="win95-menu">
      {menuItems.map((item) => (
        <button key={item} className="win95-menu-item">
          {item}
        </button>
      ))}
      <button 
        onClick={handleSubmit}
        className="win95-menu-item ml-auto"
        style={{
          marginLeft: 'auto',
          backgroundColor: '#c0c0c0',
          border: '2px solid',
          borderTopColor: '#ffffff',
          borderLeftColor: '#ffffff',
          borderRightColor: '#808080',
          borderBottomColor: '#808080',
          padding: '2px 8px',
        }}
      >
        Submit Code
      </button>
    </div>
  );
};
