<?php

namespace MadeHQ\Gutenberg\Controllers;

use SilverStripe\Control\{Controller, HTTPRequest, HTTPResponse};
use SilverStripe\ORM\DataObject;
use SilverStripe\Core\Convert;

use Embed\Embed;
use Embed\Http\CurlDispatcher;

class APIController extends Controller
{
    /**
     * @var array
     */
    private static $allowed_actions = [
        'oembed',
        'posts',
        'none',
    ];

    /**
     * @config
     * @var array
     */
    private static $oembed_options = [
        'min_image_width' => 60,
        'min_image_height' => 60,
        'html' => [
            'max_images' => 10,
            'external_images' => false,
        ],
    ];

    /**
     * @param HTTPRequest $request
     * @return HTTPResponse
     */
    public function oembed(HTTPRequest $request)
    {
        // Grab the URL
        $url = $request->getVar('url');

        if (is_null($url) || !strlen($url)) {
            return $this->output(null);
        }

        try {
            // Embed options
            $options = array_merge(
                Embed::$default_config, static::$oembed_options
            );

            // Useful if we ever wish to find out why fetch went wrong
            $dispatcher = new CurlDispatcher();

            // Try to fetch data
            $webpage = Embed::create($url, $options, $dispatcher);

            // Get all providers
            $providers = $webpage->getProviders();

            if (array_key_exists('oembed', $providers)) {
                $data = $providers['oembed']->getBag()->getAll();
            } else {
                $data = null;
            }
        } catch (\Exception $exception) {
            // Don't care about errors
            $data = null;
        }

        return $this->output($data);
    }

    /**
     * @param HTTPRequest $request
     * @return HTTPResponse
     */
    public function posts(HTTPRequest $request)
    {
        // Grab the URL
        $search = $request->getVar('search');
        $perPage = $request->getVar('per_page');

        // Do search
        $pages = DataObject::get('Page')
            ->filter([
                'Title:PartialMatch' => Convert::raw2sql($search),
            ])
            ->limit($perPage)
            ->sort('LastEdited DESC');

        // Create a structrue that Gutenberg expects
        $data = [];

        foreach ($pages as $page) {
            array_push($data, [
                'id' => $page->ID,
                'title' => [
                    'rendered' => $page->Title,
                ],
                'link' => $page->Link(),
            ]);
        }

        return $this->output($data);
    }

    /**
     * @param HTTPRequest $request
     * @return HTTPResponse
     */
    public function none()
    {
        return $this->output([]);
    }

    /**
     * @return HTTPResponse
     */
    protected function output(array $data = null)
    {
        // Body & status code
        $responseBody = Convert::array2json($data);
        $statusCode = is_null($data) ? 404 : 200;

        // Get a new response going
        $response = new HTTPResponse($responseBody, $statusCode);

        // Add some headers
        $response->addHeader('Content-Type', 'application/json; charset=utf-8');
        $response->addHeader('Access-Control-Allow-Methods', 'GET');
        $response->addHeader('Access-Control-Allow-Origin', '*');

        // Return
        return $response;
    }
}
