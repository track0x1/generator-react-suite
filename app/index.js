'use strict';

var yeoman = require('yeoman-generator');
var _ = require('lodash');
var config = require('./config.json');
var path = require('path');

module.exports = yeoman.generators.Base.extend({

    initializing: function () {
        this.log('Welcome to the React Suite Component generator!');

        this.componentProps = [];
        this.processedComponentProps = [];
        this.processedComponentPropVals = [];
    },

    prompting: function () {
        var _this = this,
            callback = this.async();

        var mainPrompt = [{
            name: 'path',
            message: 'Where would you like the generated files to go?',
            'default': config.path
        }, {
            name: 'componentName',
            message: 'What is your component\'s name?'
        }, {
            type: 'confirm',
            name: 'addProp',
            message: 'Would you like to add a prop?',
            'default': true
        }];

        var propsPrompt = [{
            name: 'propName',
            message: 'What is your prop\'s name?'
        }, {
            name: 'propType',
            message: 'What is your prop\'s type?',
            type: 'expand',
            choices: [
                {
                    key: 's',
                    name: 'String',
                    value: 'string'
                }, {
                    key: 'b',
                    name: 'Boolean',
                    value: 'bool'
                }, {
                    key: 'n',
                    name: 'Number',
                    value: 'number'
                }, {
                    key: 'a',
                    name: 'Array',
                    value: 'array'
                }, {
                    key: 'o',
                    name: 'Object',
                    value: 'object'
                }, {
                    key: 'f',
                    name: 'Function',
                    value: 'func'
                }
            ]
        }, {
            name: 'propValue',
            message: 'Default value? [empty for none]'
        }, {
            type: 'confirm',
            name: 'addProp',
            message: 'Would you like to add another prop?',
            'default': false
        }];

        function promptForProps(callback) {
            _this.prompt(propsPrompt, function (rsp) {
                _this.componentProps.push({
                    propName: rsp.propName,
                    propType: rsp.propType,
                    propValue: rsp.propValue
                });

                if (rsp.addProp) {
                    promptForProps(callback);
                } else {
                    callback();
                }
            });
        }

        function processPath(path) {
            if (path.slice(-1) !== '/') {
                path += '/';
            }

            return path;
        }

        this.prompt(mainPrompt, function (rsp) {
            this.path = processPath(rsp.path);
            this.componentName = rsp.componentName;
            this.addToLibrary = rsp.addToLibrary;

            if (rsp.addProp) {
                promptForProps(callback);
            } else {
                callback();
            }

        }.bind(this));

    },

    'default': function () {
        // Process data in here
        var _this = this;

        var reactTypes = {
            'string': 'React.PropTypes.string',
            'object': 'React.PropTypes.object',
            'number': 'React.PropTypes.number',
            'func': 'React.PropTypes.func',
            'bool': 'React.PropTypes.bool',
            'array': 'React.PropTypes.array'
        };

        function sanitize(ptype, value) {
            switch (ptype) {
                case 'string': {
                    value = '\'' + value + '\'';
                    break;
                }

                case 'bool': {
                    value = value.toLowerCase();

                    if (value === 't' || value === 'true') {
                        value = 'true';
                    } else if (value === 'f' || value === 'false') {
                        value = 'false';
                    }

                    break;
                }

                default: {
                    break;
                }
            }

            return value;
        }

        _.each(this.componentProps, function (prop) {
            // Prop.propName ; prop.propType ; prop.propValue
            _this.processedComponentProps.push({
                name: prop.propName,
                type: reactTypes[prop.propType]
            });

            // Note: there is no validation for correct values!
            if (prop.propValue) {
                var val = sanitize(prop.propType, prop.propValue);

                _this.processedComponentPropVals.push({
                    name: prop.propName,
                    val: val
                });
            }
        });

    },

    writing: {
        jsx: function () {
            this.fs.copyTpl(
                this.templatePath('template.jsx.template'),
                this.destinationPath(this.path + this.componentName + '/' + this.componentName + '.jsx'),
                {
                    formattedComponentName: _.kebabCase(this.componentName),
                    componentName: this.componentName,
                    propsWithType: this.processedComponentProps,
                    propsWithVal: this.processedComponentPropVals
                }
            );
        },

        tests: function () {
            var destinationPath = this.path + this.componentName + '/__tests__/';
            this.fs.copyTpl(
                this.templatePath('template_tests.es6.template'),
                this.destinationPath(destinationPath + this.componentName + 'Spec.jsx'),
                {
                    componentName: this.componentName
                }
            );
            this.fs.write(destinationPath + '/fixtures/' + this.componentName + '.json', '{}');
        },

        scss: function () {
            var formattedComponentName = _.kebabCase(this.componentName);
            var cssPath = path.relative(this.path + this.componentName + '/', config.css_tools);

            this.fs.copyTpl(
                this.templatePath('template.scss.template'),
                this.destinationPath(this.path + this.componentName + '/' + this.componentName + '.scss'),
                {
                    componentName: formattedComponentName,
                    cssPath: cssPath
                }
            );
        },

        benchmarks: function () {
            this.fs.copyTpl(
                this.templatePath('template_benchmarks.es6.template'),
                this.destinationPath(this.path + this.componentName + '/__benchmarks__/' + this.componentName + 'Bench.jsx'),
                {
                    componentName: this.componentName
                }
            );
        },

        readme: function () {
            var msg = this.componentName + ' component was generated by Yeoman Generator.';

            this.write(this.path + this.componentName + '/README.md', msg);
        }
    }
});
