/*
 * Glavweb.cms AdminContentPanel
 *
 * https://github.com/glavweb/cms-admin-panel-js
 *
 * Copyright (C) GLAVWEB <info@glavweb.ru>
 *
 * @author Andrey Nilov <nilov@glavweb.ru>
 * @license The MIT License (MIT)
 */
(function($){
    /**
     * Constructor
     */
    function AdminContentPanel(wrapper, options) {
        this.options = $.extend({
            apiToken : null,
            adminDashboardUrl: null,
            contentBlock: {
                apiUrl   : null,
                adminUrl : null
            },
            object: {
                adminUrl : null
            }
        }, options);

        this.ui = {
            contentBlock : wrapper.find('[data-content-block="true"]'),
            object       : wrapper.find('[data-content-object="true"]'),
            statusLine   : this.buildStatusLine()
        };

        this.stateContentBlocks = {};

        this.defineListeners();
    }

    /**
     * Define listeners
     */
    AdminContentPanel.prototype.defineListeners = function () {
        var self = this;

        // Open admin dashboard
        this.onOpenAdminDashboard();

        // Content block listeners
        this.onContentBlockMouseMove();
        this.onContentBlockClick();
        this.onContentBlockBlur();

        // Object item listeners
        this.onObjectClick();
    };

    /**
     * On open admin dashboard
     */
    AdminContentPanel.prototype.onOpenAdminDashboard = function () {
        var self = this;

        $(document).on('keydown', function(e) {
            if (e.ctrlKey) {
                if (e.keyCode == 65 || e.keyCode == 97) { // 'A' or 'a'
                    e.preventDefault();

                    self.openIframeWindow(self.options.adminDashboardUrl);
                }
            }
        });
    };

    /**
     * On content block mouse move
     */
    AdminContentPanel.prototype.onContentBlockMouseMove = function () {
        $(document).on('mousemove', this.ui.contentBlock.selector, function(event) {
            if (event.ctrlKey) {
                this.contentEditable = true;
            }
        });
    };

    /**
     * On content block click
     */
    AdminContentPanel.prototype.onContentBlockClick = function () {
        var self = this;

        $(document).on('click', this.ui.contentBlock.selector, function(event) {
            var category = $(this).data('content-block-category');
            var name     = $(this).data('content-block-name');

            // Crtl + Alt
            if (event.ctrlKey && event.altKey) {
                self.getJson(self.options.contentBlock.apiUrl + '/id', {
                    category: category,
                    name:     name
                }, function (response) {
                    self.openIframeWindow(self.options.contentBlock.adminUrl + '/' + response.id + '/edit');
                });

                return false;
            }

            // Crtl
            if (event.ctrlKey) {
                this.contentEditable = true;

                var body = $(this).text();
                self.setStateContentBlock(category, name, body);

                return false;
            }
        });
    };

    /**
     * On content block blur
     */
    AdminContentPanel.prototype.onContentBlockBlur = function () {
        var self = this;

        $(document).on('blur', this.ui.contentBlock.selector, function(){
            this.contentEditable = false;

            var category = $(this).data('content-block-category');
            var name     = $(this).data('content-block-name');
            var body     = $(this).html();

            self.saveContentBlockChanges(category, name, body);
        });
    };

    /**
     * On object item click
     */
    AdminContentPanel.prototype.onObjectClick = function () {
        var self = this;

        $(document).on('click', this.ui.object.selector, function(event) {
            // Crtl or Crtl + Alt
            if (event.ctrlKey || (event.ctrlKey && event.altKey)) {
                var id = $(this).data('content-object-id');

                self.openIframeWindow(self.options.object.adminUrl + '/' + id + '/edit');

                return false;
            }
        });
    };

    /**
     * Build status line
     */
    AdminContentPanel.prototype.buildStatusLine = function () {
        var statusLineElement = '<div class="content-block-status-line" style="' +
            'position: fixed; ' +
            'bottom: 0; ' +
            'z-index: 1500; ' +
            'display: none; ' +
            'width: 100%; ' +
            'min-height: 20px; ' +
            'padding-left: 5px; ' +
            'font-family: Arial, Sans-Serif; ' +
            'font-size: 12px; ' +
            'color: black; ' +
            'background-color: white; ' +
            '"></div>';
        var $statusLineElement = $(statusLineElement)

        $('body').append($statusLineElement);

        return $statusLineElement;
    };

    /**
     * Set state content block
     *
     * @param {string} category
     * @param {string} name
     * @param {string} body
     */
    AdminContentPanel.prototype.setStateContentBlock = function (category, name, body) {
        var key = category + '__' + name;

        this.stateContentBlocks[key] = body;
    };

    /**
     * Get state content block
     *
     * @param {string} category
     * @param {string} name
     * @returns {string}
     */
    AdminContentPanel.prototype.getStateContentBlock = function (category, name) {
        var key = category + '__' + name;

        return this.stateContentBlocks[key];
    };

    /**
     * Save changes
     *
     * @param {string} category
     * @param {string} name
     * @param {string} body
     */
    AdminContentPanel.prototype.saveContentBlockChanges = function (category, name, body) {
        var self = this;
        if (!this.options.contentBlock.apiUrl) {
            throw new Error('API URL is not defined.');
        }

        // skip save
        if (this.getStateContentBlock(category, name) == body) {
            return true;
        }

        $.ajax({
            url: this.options.contentBlock.apiUrl,
            method: 'PUT',
            headers: {
                Token: this.options.apiToken
            },
            data: {
                category: category,
                name:     name,
                body:     body
            },
            dataType: 'json',
            cache: false,
            beforeSend: function( xhr ) {
                self.ui.statusLine.text('сохранение ...');
                self.ui.statusLine.show();
            },
            success: function () {
                self.ui.statusLine.text('сохранено успешно!');

                setTimeout(function () {
                    self.ui.statusLine.hide();
                }, 3000);
            },
            error: function () {
                self.ui.statusLine.hide();

                alert('Error!');
            }
        });
    };

    /**
     * Get JSON
     */
    AdminContentPanel.prototype.getJson = function (url, data, callback) {
        var self     = this;
        var response = {};

        $.ajax({
            url: url,
            method: 'GET',
            headers: {
                Token: self.options.apiToken
            },
            data: data,
            dataType: 'json',
            cache: false,
            beforeSend: function(xhr) {
                self.ui.statusLine.text('получение данных ...');
                self.ui.statusLine.show();
            },
            success: function (xhr) {
                self.ui.statusLine.hide();

                callback(xhr);
            },
            error: function () {
                self.ui.statusLine.hide();

                alert('Error!');
            }
        });

        return response;
    };

    /**
     * Open iframe window
     *
     * @param {string} href
     */
    AdminContentPanel.prototype.openIframeWindow = function (href) {
        $.fancybox.open({
            padding : 0,
            href        : href,
            fitToView	: false,
            width		: '100%',
            height		: '100%',
            autoSize	: false,
            closeClick	: false,
            openEffect	: 'none',
            closeEffect	: 'none',
            type        : 'iframe',
            afterClose : function () {
                window.location.reload();
            }
        });
    };

    /**
     * Init plugin
     */
    $.fn.adminContentPanel = function (options) {
        return new AdminContentPanel(this, options);
    };
})(jQuery);