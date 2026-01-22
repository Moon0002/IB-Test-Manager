import React, { useState, useEffect, useRef } from 'react';
import './StructuredPaperSelector.css';

const StructuredPaperSelector = ({ onSelectionSubmit }) => {
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedPaper, setSelectedPaper] = useState('');

  // Dynamic data states (only for Group and Subject)
  const [availableGroups, setAvailableGroups] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  
  // Loading states (only for Group and Subject)
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs to track previous values for hierarchical resetting
  const prevYearRef = useRef('');
  const prevMonthRef = useRef('');
  const prevGroupRef = useRef('');
  const prevSubjectRef = useRef('');
  const isInitialRender = useRef(true);

  // Hardcoded static options for better performance
  const years = Array.from({ length: 16 }, (_, i) => 2010 + i);
  const months = ['May', 'November'];
  const levels = ['HL', 'SL'];
  const papers = ['Paper 1', 'Paper 2', 'Paper 3'];

  // API base URL (api route to display available options)
  const API_BASE = '/api/available-options';

  // No need to load years and months - they are hardcoded

  // Load available groups when month changes
  useEffect(() => {
    if (selectedMonth) {
      loadAvailableGroups(selectedYear, selectedMonth);
    } else {
      setAvailableGroups([]);
      setSelectedGroup('');
    }
  }, [selectedMonth, selectedYear]);

  // Load available subjects when group changes
  useEffect(() => {
    if (selectedGroup) {
      loadAvailableSubjects(selectedYear, selectedMonth, selectedGroup);
    } else {
      setAvailableSubjects([]);
      setSelectedSubject('');
    }
  }, [selectedGroup, selectedYear, selectedMonth]);

  // API Functions (only for Group and Subject)

  const loadAvailableGroups = async (year, month) => {
    setIsLoadingGroups(true);
    try {
      const response = await fetch(`${API_BASE}?year=${year}&month=${month}`);
      if (response.ok) {
        const data = await response.json();
        if (data.type === 'groups' && Array.isArray(data.data)) {
          setAvailableGroups(data.data);
        }
      }
    } catch (error) {
      console.error('Error loading groups:', error);
      // Fallback to empty groups if API fails
      setAvailableGroups([]);
    } finally {
      setIsLoadingGroups(false);
    }
  };

  const loadAvailableSubjects = async (year, month, group) => {
    setIsLoadingSubjects(true);
    try {
      const response = await fetch(`${API_BASE}?year=${year}&month=${month}&group=${encodeURIComponent(group)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.type === 'subjects' && Array.isArray(data.data)) {
          setAvailableSubjects(data.data);
        }
      }
    } catch (error) {
      console.error('Error loading subjects:', error);
      // Fallback to empty subjects if API fails
      setAvailableSubjects([]);
    } finally {
      setIsLoadingSubjects(false);
    }
  };

  // Get available subjects - now relies entirely on API data
  const getAvailableSubjects = () => {
    return availableSubjects;
  };

  // Progressive field unlocking
  const isMonthEnabled = !!selectedYear;
  const isGroupEnabled = !!selectedMonth;
  const isSubjectEnabled = !!selectedGroup;
  const isLevelPaperEnabled = !!selectedSubject;
  
  // Check if audio group is selected (Level and Paper not needed)
  const isAudioGroup = selectedGroup === 'Group Ex - Audio';
  // Check if Group 6 Music is selected (Level needed, Paper not needed)
  // Only apply Music-specific logic when BOTH Group 6 AND Music subject are selected
  const isGroup6Music = selectedGroup === 'Group 6 - The Arts' && selectedSubject && selectedSubject.toLowerCase() === 'music';
  const isLevelEnabled = isLevelPaperEnabled && !isAudioGroup;
  const isPaperEnabled = isLevelPaperEnabled && !isAudioGroup && !isGroup6Music;

  // Dynamic guidance message
  const getGuidanceMessage = () => {
    if (!selectedYear) {
      return { text: "Select Year First", color: "#dc3545" };
    }
    if (!selectedMonth) {
      return { text: "Now select Month", color: "#dc3545" };
    }
    if (isLoadingGroups) {
      return { text: "Loading available groups...", color: "#007bff" };
    }
    if (!selectedGroup) {
      return { text: "Now select Group", color: "#dc3545" };
    }
    if (isLoadingSubjects) {
      return { text: "Loading available subjects...", color: "#007bff" };
    }
    if (!selectedSubject) {
      return { text: "Now select Subject", color: "#dc3545" };
    }
    if (isAudioGroup) {
      return { text: "Ready to find your audio file! 🎯", color: "#28a745" };
    }
    if (isGroup6Music) {
      return { text: "Ready to find your Music files! 🎵", color: "#28a745" };
    }
    if (!selectedLevel || !selectedPaper) {
      return { text: "Finally, select Level and Paper", color: "#dc3545" };
    }
    return { text: "Ready to find your paper! 🎯", color: "#28a745" };
  };

  // Hierarchical resetting: when a parent field changes, reset all dependent fields
  useEffect(() => {
    // Skip initial render
    if (isInitialRender.current) {
      isInitialRender.current = false;
      prevYearRef.current = selectedYear;
      return;
    }
    
    // When year changes, reset all dependent fields
    if (selectedYear !== prevYearRef.current) {
      setSelectedMonth('');
      setSelectedGroup('');
      setSelectedSubject('');
      setSelectedLevel('');
      setSelectedPaper('');
    }
    prevYearRef.current = selectedYear;
  }, [selectedYear]);

  useEffect(() => {
    // Skip initial render
    if (isInitialRender.current) {
      prevMonthRef.current = selectedMonth;
      return;
    }
    
    // When month changes, reset all dependent fields
    if (selectedMonth !== prevMonthRef.current) {
      setSelectedGroup('');
      setSelectedSubject('');
      setSelectedLevel('');
      setSelectedPaper('');
    }
    prevMonthRef.current = selectedMonth;
  }, [selectedMonth]);

  useEffect(() => {
    // Skip initial render
    if (isInitialRender.current) {
      prevGroupRef.current = selectedGroup;
      return;
    }
    
    // When group changes, reset all dependent fields
    if (selectedGroup !== prevGroupRef.current) {
      setSelectedSubject('');
      setSelectedLevel('');
      setSelectedPaper('');
    }
    prevGroupRef.current = selectedGroup;
  }, [selectedGroup]);

  useEffect(() => {
    // Skip initial render
    if (isInitialRender.current) {
      prevSubjectRef.current = selectedSubject;
      return;
    }
    
    // When subject changes, reset level and paper
    if (selectedSubject !== prevSubjectRef.current) {
      setSelectedLevel('');
      setSelectedPaper('');
    }
    prevSubjectRef.current = selectedSubject;
  }, [selectedSubject]);

  const handleSubmit = async () => {
    if (isFormComplete() && !isSubmitting) {
      setIsSubmitting(true);
      
      // Create query string following the file path structure: Year Month Group Subject Level Paper
      let query;
      if (isAudioGroup) {
        // For audio group, we don't need Level and Paper
        query = `${selectedYear} ${selectedMonth} ${selectedGroup} ${selectedSubject}`;
      } else if (isGroup6Music) {
        // For Group 6 Music, we don't need Paper (but we need Level)
        query = `${selectedYear} ${selectedMonth} ${selectedGroup} ${selectedSubject} ${selectedLevel}`;
      } else {
        // Standard format: Year Month Group Subject Level Paper
        query = `${selectedYear} ${selectedMonth} ${selectedGroup} ${selectedSubject} ${selectedLevel} ${selectedPaper}`;
      }
      
      console.log('Sending structured query to chatbot:', query);
      onSelectionSubmit(query);
      
      // Brief delay to show the submitting state
      setTimeout(() => {
        setIsSubmitting(false);
      }, 1000);
    }
  };

  const handleReset = () => {
    setSelectedYear('');
    setSelectedMonth('');
    setSelectedGroup('');
    setSelectedSubject('');
    setSelectedLevel('');
    setSelectedPaper('');
    
    // Reset refs as well
    prevYearRef.current = '';
    prevMonthRef.current = '';
    prevGroupRef.current = '';
    prevSubjectRef.current = '';
    isInitialRender.current = true;
  };

  const isFormComplete = () => {
    if (isAudioGroup) {
      // For audio group, only need year, month, group, and subject
      return selectedYear && selectedMonth && selectedGroup && selectedSubject;
    }
    if (isGroup6Music) {
      // For Group 6 Music, need year, month, group, subject, and level (no paper)
      return selectedYear && selectedMonth && selectedGroup && selectedSubject && selectedLevel;
    }
    // For other groups, need all fields including level and paper
    return selectedYear && selectedMonth && selectedGroup && selectedSubject && selectedLevel && selectedPaper;
  };

  const isSubmitEnabled = isFormComplete() && !isSubmitting;

  const guidance = getGuidanceMessage();

  // Use hardcoded data for years and months, dynamic data for groups and subjects
  const displayYears = years;
  const displayMonths = months;
  const displayGroups = availableGroups.length > 0 ? availableGroups : [];
  const displaySubjects = getAvailableSubjects();

  return (
    <div className="structured-selector">
      <div className="selector-header">
        <h3>📄 IB Past Papers Finder</h3>
        <p>Choose your options to find the exact paper you need</p>
        <div className="guidance-message" style={{ color: guidance.color }}>
          {guidance.text}
        </div>
      </div>

      <div className="selector-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="year">Year *</label>
            <select
              id="year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="form-select"
            >
              <option value="">Select Year</option>
              {displayYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="month">Month *</label>
            <select
              id="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="form-select"
              disabled={!isMonthEnabled}
            >
              <option value="">Select Month</option>
              {displayMonths.map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="group">Group *</label>
            <select
              id="group"
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className={`form-select ${isLoadingGroups ? 'loading' : ''}`}
              disabled={!isGroupEnabled || isLoadingGroups}
            >
              <option value="">Select Group</option>
              {displayGroups.map(group => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="subject">Subject *</label>
            <select
              id="subject"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className={`form-select ${isLoadingSubjects ? 'loading' : ''}`}
              disabled={!isSubjectEnabled || isLoadingSubjects}
            >
              <option value="">Select Subject</option>
              {displaySubjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="level">Level *</label>
            <select
              id="level"
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="form-select"
              disabled={!isLevelEnabled}
            >
              <option value="">{isAudioGroup ? "Not applicable" : "Select Level"}</option>
              {!isAudioGroup && levels.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="paper">Paper *</label>
            <select
              id="paper"
              value={selectedPaper}
              onChange={(e) => setSelectedPaper(e.target.value)}
              className="form-select"
              disabled={!isPaperEnabled}
            >
              <option value="">{(isAudioGroup || isGroup6Music) ? "Not applicable" : "Select Paper"}</option>
              {!(isAudioGroup || isGroup6Music) && papers.map(paper => (
                <option key={paper} value={paper}>{paper}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleReset}
          >
            <span className="btn-icon">🔄</span>
            Reset All
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className={`submit-button ${!isSubmitEnabled ? 'disabled' : ''}`}
            disabled={!isSubmitEnabled}
          >
            {isSubmitting ? 'Sending...' : 
             isSubmitEnabled ? (isAudioGroup ? '🎯 Find My Audio' : isGroup6Music ? '🎵 Find My Music Files' : '🎯 Find My Paper') : 
             'Complete All Selections'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StructuredPaperSelector;
