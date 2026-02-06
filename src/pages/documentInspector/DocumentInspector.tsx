import { FileUp, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { ImportService, TeamsService, type Team } from '../../apiConfig';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ErrorDisplay from '../../components/shared/ErrorDisplay';
import './DocumentInspector.css';

interface ValidationIssue {
  code?: string;
  severity?: string;
  message?: string;
  path?: string | null;
  evidence?: Record<string, unknown>;
}

interface InspectionResult {
  extracted: {
    rooms?: string[];
    slots?: Array<{
      startTime?: string;
      roomLabel?: string;
      teams?: string[];
    }>;
    distributions?: Array<{
      distributionTime?: string;
      teams?: string[];
    }>;
    declaredSlotDurationMinutes?: number;
    declaredEndTime?: string;
  };
  report: {
    errors?: ValidationIssue[];
    warnings?: ValidationIssue[];
    stats?: {
      expectedTeamsCount?: number;
      foundTeamsCount?: number;
      missingCount?: number;
      duplicateCount?: number;
      unexpectedCount?: number;
      slotCount?: number;
      roomsCount?: number;
    };
  };
  normalizedPreview: {
    slots?: Array<{
      startTime?: string;
      roomLabel?: string;
      teams?: string[];
    }>;
    distributions?: Array<{
      distributionTime?: string;
      teams?: string[];
    }>;
    metadata?: {
      slotDurationMinutes?: number;
      parsedAt?: string;
      totalTeams?: number;
      totalRooms?: number;
      totalSlots?: number;
    };
  };
}

const DocumentInspector = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [selectedTeamLabels, setSelectedTeamLabels] = useState<string[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [strictMode, setStrictMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InspectionResult | null>(null);
  const [highlightedSlot, setHighlightedSlot] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setError(null);
    } else {
      setPdfFile(null);
      setError('Please select a valid PDF file');
    }
  };

  // Fetch teams on mount
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoadingTeams(true);
        const teamsData = await TeamsService.getAllTeams();
        setTeams(teamsData);
      } catch (err) {
        console.warn('Failed to fetch teams:', err);
        // Use mock data for demo if API is unavailable
        setTeams([
          { id: 1, label: 'A1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 2, label: 'A2', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 3, label: 'A3', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 4, label: 'B1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 5, label: 'B2', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 6, label: 'B3', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        ]);
      } finally {
        setLoadingTeams(false);
      }
    };
    fetchTeams();
  }, []);

  const handleInspect = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pdfFile) {
      setError('Please select a PDF file');
      return;
    }

    if (selectedTeamLabels.length === 0) {
      setError('Please select at least one team');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const requestData = {
        expectedTeams: selectedTeamLabels,
        strictMode: strictMode,
      };

      const response = await ImportService.inspectDocument({
        pdf: pdfFile,
        request: JSON.stringify(requestData),
      });

      setResult(response);
      toast.success('Document inspected successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to inspect document';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleIssueClick = (issue: ValidationIssue) => {
    // Highlight related slot or room
    if (issue.evidence?.team) {
      setHighlightedSlot(`team-${issue.evidence.team}`);
    } else if (issue.evidence?.startTime && issue.evidence?.roomLabel) {
      setHighlightedSlot(`slot-${issue.evidence.startTime}-${issue.evidence.roomLabel}`);
    }
  };

  const getIssueSeverityIcon = (severity?: string) => {
    switch (severity) {
      case 'error':
        return <AlertCircle className="issue-icon error" size={20} />;
      case 'warning':
        return <AlertCircle className="issue-icon warning" size={20} />;
      default:
        return <Info className="issue-icon info" size={20} />;
    }
  };

  // Group slots by time for table view
  const getScheduleTable = () => {
    if (!result?.normalizedPreview.slots || !result?.extracted.rooms) {
      return null;
    }

    const slots = result.normalizedPreview.slots;
    const rooms = result.extracted.rooms;

    // Group slots by start time
    const slotsByTime = new Map<string, Map<string, string[]>>();
    
    slots.forEach(slot => {
      if (slot.startTime && slot.roomLabel && slot.teams) {
        if (!slotsByTime.has(slot.startTime)) {
          slotsByTime.set(slot.startTime, new Map());
        }
        slotsByTime.get(slot.startTime)?.set(slot.roomLabel, slot.teams);
      }
    });

    // Sort times
    const sortedTimes = Array.from(slotsByTime.keys()).sort();

    return (
      <div className="schedule-table-container">
        <h3>📅 Extracted Schedule Preview</h3>
        <p className="trust-ui-note">Parsed from PDF: page 1</p>
        <table className="schedule-table">
          <thead>
            <tr>
              <th>Time</th>
              {rooms.map(room => (
                <th key={room}>{room}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedTimes.map(time => (
              <tr key={time}>
                <td className="time-cell">{time}</td>
                {rooms.map(room => {
                  const teams = slotsByTime.get(time)?.get(room) || [];
                  const cellId = `slot-${time}-${room}`;
                  const isHighlighted = highlightedSlot === cellId;
                  
                  return (
                    <td 
                      key={room} 
                      className={`slot-cell ${isHighlighted ? 'highlighted' : ''}`}
                      id={cellId}
                    >
                      {teams.length > 0 ? (
                        <div className="teams-list">
                          {teams.map(team => (
                            <span 
                              key={team} 
                              className={`team-badge ${highlightedSlot === `team-${team}` ? 'highlighted' : ''}`}
                              id={`team-${team}`}
                            >
                              {team}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="empty-slot">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="document-inspector">
      <div className="page-header">
        <h1>📄 Document Inspector</h1>
        <p>Upload a PDF schedule and validate it against expected teams</p>
      </div>

      <div className="inspector-content">
        {/* Input Form */}
        <div className="inspector-form-card">
          <form onSubmit={handleInspect}>
            <div className="form-section">
              <label htmlFor="pdf-upload" className="form-label">
                <FileUp size={20} />
                PDF Upload
              </label>
              <input
                id="pdf-upload"
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="file-input"
              />
              {pdfFile && (
                <div className="file-selected">
                  <CheckCircle size={16} className="check-icon" />
                  <span>{pdfFile.name}</span>
                </div>
              )}
            </div>

            <div className="form-section">
              <div className="form-group-header">
                <label className="form-label">
                  Select Teams
                </label>
                <div className="select-controls">
                  <button
                    type="button"
                    className="btn-link"
                    onClick={() => setSelectedTeamLabels(teams.map(team => team.label))}
                  >
                    Select All
                  </button>
                  <span className="control-separator">|</span>
                  <button
                    type="button"
                    className="btn-link"
                    onClick={() => setSelectedTeamLabels([])}
                  >
                    Clear
                  </button>
                </div>
              </div>
              {loadingTeams ? (
                <div className="loading-teams">
                  <LoadingSpinner />
                  <span>Loading teams...</span>
                </div>
              ) : (
                <div className="checkbox-group">
                  {teams.map((team) => (
                    <label key={team.id} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={selectedTeamLabels.includes(team.label)}
                        onChange={(e) => {
                          const newLabels = e.target.checked
                            ? [...selectedTeamLabels, team.label]
                            : selectedTeamLabels.filter((label) => label !== team.label);
                          setSelectedTeamLabels(newLabels);
                        }}
                      />
                      {team.label}
                    </label>
                  ))}
                </div>
              )}
              <small className="help-text">
                Select the teams you expect to find in the document
              </small>
            </div>

            <div className="form-section">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={strictMode}
                  onChange={(e) => setStrictMode(e.target.checked)}
                />
                <span>Strict Mode</span>
              </label>
              <small className="help-text">
                Enable strict validation rules
              </small>
            </div>

            {error && (
              <ErrorDisplay message={error} />
            )}

            <button 
              type="submit" 
              className="btn-primary btn-inspect"
              disabled={loading || !pdfFile || selectedTeamLabels.length === 0}
            >
              {loading ? 'Inspecting...' : 'Inspect Document'}
            </button>
          </form>
        </div>

        {/* Results Section */}
        {loading && (
          <div className="results-loading">
            <LoadingSpinner />
            <p>Inspecting document...</p>
          </div>
        )}

        {result && !loading && (
          <div className="inspector-results">
            {/* Summary Badges */}
            <div className="summary-badges">
              <div className="badge badge-error">
                <AlertCircle size={20} />
                <div>
                  <span className="badge-label">Errors</span>
                  <span className="badge-value">{result.report.errors?.length || 0}</span>
                </div>
              </div>
              <div className="badge badge-warning">
                <AlertCircle size={20} />
                <div>
                  <span className="badge-label">Warnings</span>
                  <span className="badge-value">{result.report.warnings?.length || 0}</span>
                </div>
              </div>
              <div className="badge badge-info">
                <CheckCircle size={20} />
                <div>
                  <span className="badge-label">Teams Found</span>
                  <span className="badge-value">{result.report.stats?.foundTeamsCount || 0}</span>
                </div>
              </div>
              <div className="badge badge-info">
                <Info size={20} />
                <div>
                  <span className="badge-label">Slots</span>
                  <span className="badge-value">{result.report.stats?.slotCount || 0}</span>
                </div>
              </div>
              <div className="badge badge-info">
                <Info size={20} />
                <div>
                  <span className="badge-label">Rooms</span>
                  <span className="badge-value">{result.report.stats?.roomsCount || 0}</span>
                </div>
              </div>
            </div>

            {/* Validation Issues */}
            {(result.report.errors && result.report.errors.length > 0) || 
             (result.report.warnings && result.report.warnings.length > 0) ? (
              <div className="validation-issues">
                <h3>⚠️ Validation Issues</h3>
                
                {result.report.errors && result.report.errors.length > 0 && (
                  <div className="issues-group">
                    <h4 className="issues-severity-header error">Errors ({result.report.errors.length})</h4>
                    <ul className="issues-list">
                      {result.report.errors.map((issue, idx) => (
                        <li 
                          key={idx} 
                          className="issue-item error"
                          onClick={() => handleIssueClick(issue)}
                        >
                          {getIssueSeverityIcon(issue.severity)}
                          <div className="issue-content">
                            <div className="issue-message">{issue.message}</div>
                            {issue.code && <div className="issue-code">Code: {issue.code}</div>}
                            {issue.evidence && (
                              <div className="issue-evidence">
                                {JSON.stringify(issue.evidence, null, 2)}
                              </div>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.report.warnings && result.report.warnings.length > 0 && (
                  <div className="issues-group">
                    <h4 className="issues-severity-header warning">Warnings ({result.report.warnings.length})</h4>
                    <ul className="issues-list">
                      {result.report.warnings.map((issue, idx) => (
                        <li key={idx} className="issue-item warning">
                          {getIssueSeverityIcon(issue.severity)}
                          <div className="issue-content">
                            <div className="issue-message">{issue.message}</div>
                            {issue.code && <div className="issue-code">Code: {issue.code}</div>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="validation-success">
                <CheckCircle size={32} className="success-icon" />
                <h3>All validations passed!</h3>
                <p>No errors or warnings found in the document.</p>
              </div>
            )}

            {/* Schedule Preview */}
            {getScheduleTable()}

            {/* Distribution Groups */}
            {result.normalizedPreview.distributions && result.normalizedPreview.distributions.length > 0 && (
              <div className="distribution-preview">
                <h3>📊 Distribution Groups</h3>
                <p className="trust-ui-note">Distribution times and team assignments</p>
                
                <div className="distribution-list">
                  {result.normalizedPreview.distributions.map((dist, idx) => (
                    <div key={idx} className="distribution-item">
                      <div className="distribution-time">
                        <span className="time-badge">{dist.distributionTime}</span>
                      </div>
                      <div className="distribution-arrow">→</div>
                      <div className="distribution-teams">
                        {dist.teams?.map(team => (
                          <span 
                            key={team} 
                            className={`team-badge ${highlightedSlot === `team-${team}` ? 'highlighted' : ''}`}
                          >
                            {team}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Start Time Mapping */}
                {result.extracted.slots && (
                  <div className="time-mapping">
                    <h4>Time Mapping</h4>
                    <div className="mapping-list">
                      {Array.from(new Set(result.extracted.slots.map(s => s.startTime))).sort().map((startTime, index) => {
                        const matchingDist = result.normalizedPreview.distributions?.find(d => 
                          result.extracted.slots?.some(s => s.startTime === startTime && d.teams?.some(t => s.teams?.includes(t)))
                        );
                        return matchingDist ? (
                          <div key={index} className="mapping-item">
                            {matchingDist.distributionTime} → {startTime}
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Metadata */}
            {result.normalizedPreview.metadata && (
              <div className="metadata-section">
                <h3>ℹ️ Document Metadata</h3>
                <div className="metadata-grid">
                  <div className="metadata-item">
                    <span className="metadata-label">Slot Duration:</span>
                    <span className="metadata-value">{result.normalizedPreview.metadata.slotDurationMinutes} minutes</span>
                  </div>
                  <div className="metadata-item">
                    <span className="metadata-label">Total Teams:</span>
                    <span className="metadata-value">{result.normalizedPreview.metadata.totalTeams}</span>
                  </div>
                  <div className="metadata-item">
                    <span className="metadata-label">Total Rooms:</span>
                    <span className="metadata-value">{result.normalizedPreview.metadata.totalRooms}</span>
                  </div>
                  <div className="metadata-item">
                    <span className="metadata-label">Total Slots:</span>
                    <span className="metadata-value">{result.normalizedPreview.metadata.totalSlots}</span>
                  </div>
                  {result.normalizedPreview.metadata.parsedAt && (
                    <div className="metadata-item">
                      <span className="metadata-label">Parsed At:</span>
                      <span className="metadata-value">{new Date(result.normalizedPreview.metadata.parsedAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentInspector;
