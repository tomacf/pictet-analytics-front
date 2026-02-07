import {ChevronDown, ChevronRight, FileText} from 'lucide-react';
import {useEffect, useRef, useState} from 'react';
import {toast} from 'react-toastify';
import {PrinterService, TeamsService, JuriesService, type Team, type Jury} from '../../apiConfig';
import ErrorDisplay from '../../components/shared/ErrorDisplay';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import './Printer.css';

interface PrinterFormData {
  file: File | null;
  selectedTeamIds: number[];
  selectedJuryIds: number[];
  fontSize: number;
  topMargin: number;
  rightMargin: number;
}

const Printer = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [juries, setJuries] = useState<Jury[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [loadingJuries, setLoadingJuries] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<PrinterFormData>({
    file: null,
    selectedTeamIds: [],
    selectedJuryIds: [],
    fontSize: 8,
    topMargin: 1,
    rightMargin: 1,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [jurySearchQuery, setJurySearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Fetch teams and juries on mount
  useEffect(() => {
    fetchTeams();
    fetchJuries();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoadingTeams(true);
      setError(null);
      const data = await TeamsService.getAllTeams();
      setTeams(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch teams';
      setError(message);
      toast.error('Failed to fetch teams');
    } finally {
      setLoadingTeams(false);
    }
  };

  const fetchJuries = async () => {
    try {
      setLoadingJuries(true);
      setError(null);
      const data = await JuriesService.getAllJuries();
      setJuries(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch juries';
      setError(message);
      toast.error('Failed to fetch juries');
    } finally {
      setLoadingJuries(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData({ ...formData, file });
  };

  const handleTeamSelection = (teamId: number) => {
    const isSelected = formData.selectedTeamIds.includes(teamId);
    const newSelectedTeamIds = isSelected
      ? formData.selectedTeamIds.filter((id) => id !== teamId)
      : [...formData.selectedTeamIds, teamId];

    setFormData({ ...formData, selectedTeamIds: newSelectedTeamIds });
  };

  const handleJurySelection = (juryId: number) => {
    const isSelected = formData.selectedJuryIds.includes(juryId);
    const newSelectedJuryIds = isSelected
      ? formData.selectedJuryIds.filter((id) => id !== juryId)
      : [...formData.selectedJuryIds, juryId];

    setFormData({ ...formData, selectedJuryIds: newSelectedJuryIds });
  };

  const handleSelectAll = () => {
    const filteredTeams = getFilteredTeams();
    const allIds = filteredTeams.map((team) => team.id);
    setFormData({ ...formData, selectedTeamIds: allIds });
  };

  const handleSelectAllJuries = () => {
    const filteredJuries = getFilteredJuries();
    const allIds = filteredJuries.map((jury) => jury.id);
    setFormData({ ...formData, selectedJuryIds: allIds });
  };

  const handleClearAll = () => {
    setFormData({ ...formData, selectedTeamIds: [] });
  };

  const handleClearAllJuries = () => {
    setFormData({ ...formData, selectedJuryIds: [] });
  };

  const getFilteredTeams = () => {
    if (!searchQuery.trim()) return teams;
    const query = searchQuery.toLowerCase();
    return teams.filter((team) => team.label.toLowerCase().includes(query));
  };

  const getFilteredJuries = () => {
    if (!jurySearchQuery.trim()) return juries;
    const query = jurySearchQuery.toLowerCase();
    return juries.filter((jury) => jury.label.toLowerCase().includes(query));
  };

  const handleGenerate = async () => {
    if (!formData.file) {
      toast.error('Please select a PDF file');
      return;
    }

    if (formData.selectedTeamIds.length === 0 && formData.selectedJuryIds.length === 0) {
      toast.error('Please select at least one team or jury');
      return;
    }

    try {
      setIsGenerating(true);

      const pdfBlob = await PrinterService.generatePrinterPdf({
        pdf: formData.file,
        team_ids: formData.selectedTeamIds.length > 0 ? formData.selectedTeamIds : undefined,
        jury_ids: formData.selectedJuryIds.length > 0 ? formData.selectedJuryIds : undefined,
        font_size: formData.fontSize,
        top_margin: formData.topMargin,
        right_margin: formData.rightMargin,
      });

      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;

      // Generate filename with timestamp
      const now = new Date();
      const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0].replace('T', '_');
      link.download = `printer_${timestamp}.pdf`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('PDF generated successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate PDF';
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredTeams = getFilteredTeams();
  const filteredJuries = getFilteredJuries();
  const isGenerateDisabled = !formData.file || (formData.selectedTeamIds.length === 0 && formData.selectedJuryIds.length === 0) || isGenerating;

  if (error && !loadingTeams && !loadingJuries) {
    return (
      <div className="page-container">
        <ErrorDisplay message={error} onRetry={() => { fetchTeams(); fetchJuries(); }} />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Printer</h1>
      </div>

      <div className="printer-layout">
        {/* Left Panel - Inputs */}
        <div className="printer-panel printer-panel-left">
          <div className="printer-section">
            <h2>PDF Upload</h2>
            <div className="pdf-upload-zone">
              <input
                ref={fileInputRef}
                id="pdfFile"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                disabled={isGenerating}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                className="upload-button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isGenerating}
              >
                <FileText size={24} />
                <span>{formData.file ? formData.file.name : 'Click to select PDF'}</span>
              </button>
              {formData.file && (
                <p className="file-info">
                  {(formData.file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              )}
            </div>
          </div>

          <div className="printer-section">
            <div className="section-header">
              <h2>Team Selection</h2>
              <div className="team-count">
                {formData.selectedTeamIds.length} selected
              </div>
            </div>

            <div className="team-controls">
              <input
                type="text"
                placeholder="Search teams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input"
                disabled={isGenerating}
              />
              <div className="control-buttons">
                <button
                  type="button"
                  className="btn-link"
                  onClick={handleSelectAll}
                  disabled={isGenerating}
                >
                  Select All
                </button>
                <span className="control-separator">|</span>
                <button
                  type="button"
                  className="btn-link"
                  onClick={handleClearAll}
                  disabled={isGenerating}
                >
                  Clear
                </button>
              </div>
            </div>

            {loadingTeams ? (
              <LoadingSpinner message="Loading teams..." />
            ) : (
              <div className="team-list">
                {filteredTeams.length === 0 ? (
                  <p className="no-teams">No teams found</p>
                ) : (
                  filteredTeams.map((team) => (
                    <label key={team.id} className="team-item">
                      <input
                        type="checkbox"
                        checked={formData.selectedTeamIds.includes(team.id)}
                        onChange={() => handleTeamSelection(team.id)}
                        disabled={isGenerating}
                      />
                      <span className="team-label" style={{ color: 'black' }}>{team.label}</span>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="printer-section">
            <div className="section-header">
              <h2>Jury Selection</h2>
              <div className="team-count">
                {formData.selectedJuryIds.length} selected
              </div>
            </div>

            <div className="team-controls">
              <input
                type="text"
                placeholder="Search juries..."
                value={jurySearchQuery}
                onChange={(e) => setJurySearchQuery(e.target.value)}
                className="form-input"
                disabled={isGenerating}
              />
              <div className="control-buttons">
                <button
                  type="button"
                  className="btn-link"
                  onClick={handleSelectAllJuries}
                  disabled={isGenerating}
                >
                  Select All
                </button>
                <span className="control-separator">|</span>
                <button
                  type="button"
                  className="btn-link"
                  onClick={handleClearAllJuries}
                  disabled={isGenerating}
                >
                  Clear
                </button>
              </div>
            </div>

            {loadingJuries ? (
              <LoadingSpinner message="Loading juries..." />
            ) : (
              <div className="team-list">
                {filteredJuries.length === 0 ? (
                  <p className="no-teams">No juries found</p>
                ) : (
                  filteredJuries.map((jury) => (
                    <label key={jury.id} className="team-item">
                      <input
                        type="checkbox"
                        checked={formData.selectedJuryIds.includes(jury.id)}
                        onChange={() => handleJurySelection(jury.id)}
                        disabled={isGenerating}
                      />
                      <span className="team-label" style={{ color: 'black' }}>{jury.label}</span>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="printer-section">
            <button
              type="button"
              className="advanced-toggle"
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              disabled={isGenerating}
            >
              {isAdvancedOpen ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
              <span>Advanced Options</span>
            </button>

            {isAdvancedOpen && (
              <div className="advanced-options">
                <div className="form-group">
                  <label htmlFor="fontSize">Font Size</label>
                  <input
                    id="fontSize"
                    type="number"
                    min="8"
                    max="48"
                    value={formData.fontSize}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        fontSize: parseInt(e.target.value, 10) || 8,
                      })
                    }
                    className="form-input"
                    disabled={isGenerating}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="topMargin">Top Margin (pt)</label>
                  <input
                    id="topMargin"
                    type="number"
                    min="0"
                    max="200"
                    value={formData.topMargin}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        topMargin: parseInt(e.target.value, 10) || 1,
                      })
                    }
                    className="form-input"
                    disabled={isGenerating}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="rightMargin">Right Margin (pt)</label>
                  <input
                    id="rightMargin"
                    type="number"
                    min="0"
                    max="200"
                    value={formData.rightMargin}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rightMargin: parseInt(e.target.value, 10) || 1,
                      })
                    }
                    className="form-input"
                    disabled={isGenerating}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="printer-section">
            <button
              type="button"
              className="btn btn-primary btn-large"
              onClick={handleGenerate}
              disabled={isGenerateDisabled}
            >
              {isGenerating ? 'Generating PDF...' : 'Generate Print PDF'}
            </button>
          </div>
        </div>

        {/* Right Panel - Status & Results */}
        <div className="printer-panel printer-panel-right">
          <div className="printer-section">
            <h2>Status</h2>

            {isGenerating ? (
              <div className="status-message status-processing">
                <LoadingSpinner message="Generating stamped PDF..." />
              </div>
            ) : formData.file && (formData.selectedTeamIds.length > 0 || formData.selectedJuryIds.length > 0) ? (
              <div className="status-message status-ready">
                <p>✓ Ready to generate</p>
                <ul className="status-details">
                  <li>PDF: {formData.file.name}</li>
                  {formData.selectedTeamIds.length > 0 && <li>Teams: {formData.selectedTeamIds.length}</li>}
                  {formData.selectedJuryIds.length > 0 && <li>Juries: {formData.selectedJuryIds.length}</li>}
                </ul>
              </div>
            ) : (
              <div className="status-message status-idle">
                <p>Select a PDF and at least one team or jury to begin</p>
              </div>
            )}
          </div>

          <div className="printer-section">
            <h2>Instructions</h2>
            <ol className="instructions-list">
              <li>Upload a PDF document</li>
              <li>Select the teams and/or juries to print for</li>
              <li>(Optional) Adjust stamp options</li>
              <li>Click "Generate Print PDF"</li>
              <li>Download and print the merged PDF once</li>
            </ol>
            <p className="instructions-note">
              Each team and jury will receive their own stamped copy in the merged PDF.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Printer;
