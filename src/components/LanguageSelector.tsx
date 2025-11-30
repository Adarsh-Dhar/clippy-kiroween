interface LanguageSelectorProps {
  selectedLanguage: string | null;
  onLanguageChange: (language: string | null) => void;
}

export const LanguageSelector = ({ selectedLanguage, onLanguageChange }: LanguageSelectorProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'auto') {
      onLanguageChange(null);
    } else {
      onLanguageChange(value);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-win95 text-black" style={{ whiteSpace: 'nowrap' }}>
        Language:
      </label>
      <select
        value={selectedLanguage || 'auto'}
        onChange={handleChange}
        className="font-win95 text-sm px-2 py-1 bg-win95-cream border-2 border-solid cursor-pointer focus:outline-none"
        style={{
          borderLeftColor: '#808080',
          borderTopColor: '#808080',
          borderRightColor: '#dfdfdf',
          borderBottomColor: '#dfdfdf',
          boxShadow: 'inset 1px 1px 0 0 #808080, inset -1px -1px 0 0 #dfdfdf',
          minWidth: '120px',
        }}
      >
        <option value="auto">Auto-detect</option>
        <option value="python">Python</option>
        <option value="javascript">JavaScript</option>
      </select>
    </div>
  );
};

