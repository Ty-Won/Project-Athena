import React, { Component } from 'react';
import PropTypes from 'prop-types';
import AutoSuggest from 'react-autosuggest';
import './SearchBar.css';

class SearchBar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      suggestions: [],
      value: '',
    };
    this.getSuggestions = this.getSuggestions.bind(this);
    this.getSuggestionValue = this.getSuggestionValue.bind(this);
    this.onClickSuggestion = this.onClickSuggestion.bind(this);
    this.renderSuggestion = this.renderSuggestion.bind(this);
  }

  // Teach Autosuggest how to calculate suggestions for any given input value.
  getSuggestions(value) {
    const inputValue = value.trim().toLowerCase();
    const inputLength = inputValue.length;
    return inputLength === 0
      ? []
      : this.props.data.filter(
          course =>
            course.course_code.toLowerCase().slice(0, inputLength) ===
              inputValue ||
            course.title.toLowerCase().slice(0, inputLength) === inputValue
        );
  }

  // When suggestion is clicked, Autosuggest needs to populate the input
  // based on the clicked suggestion.
  getSuggestionValue(suggestion) {
    return suggestion.course_code + ' ' + suggestion.title;
  }

  // Autosuggest will call this function every time you need to update suggestions.
  onSuggestionsFetchRequested = ({ value }) => {
    this.setState({
      suggestions: this.getSuggestions(value),
    });
  };

  // Autosuggest will call this function every time you need to clear suggestions.
  onSuggestionsClearRequested = () => {
    this.setState({
      suggestions: [],
    });
  };

  // Update value of search input
  onChange = (event, { newValue }) => {
    this.setState({
      value: newValue,
    });
  };

  // Passes the suggestion value to the parent component
  onClickSuggestion(suggestion) {
    this.props.getValue(suggestion);
  }

  // Renders the suggestions under the search bar
  renderSuggestion(suggestion) {
    return (
      <div
        className="suggestion-item"
        onClick={this.onClickSuggestion(suggestion)}
      >
        <div className="suggestion-code">{suggestion.course_code}</div>
        <div className="suggestion-title">{suggestion.title}</div>
      </div>
    );
  }

  render() {
    const { value, suggestions } = this.state;

    const inputProps = {
      placeholder: 'Type a course number',
      value,
      onChange: this.onChange,
    };

    return (
      <AutoSuggest
        suggestions={suggestions}
        onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
        onSuggestionsClearRequested={this.onSuggestionsClearRequested}
        getSuggestionValue={this.getSuggestionValue}
        renderSuggestion={this.renderSuggestion}
        inputProps={inputProps}
      />
    );
  }
}

SearchBar.propTypes = {
  // Function that passes the value back to the parent
  getValue: PropTypes.func,
  // List of data to search from
  data: PropTypes.arrayOf(PropTypes.object),
};

export default SearchBar;
