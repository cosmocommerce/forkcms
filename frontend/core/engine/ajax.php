<?php

/*
 * This file is part of Fork CMS.
 *
 * For the full copyright and license information, please view the license
 * file that was distributed with this source code.
 */

use Symfony\Component\Finder\Finder;

/**
 * FrontendAJAX
 * This class will handle AJAX-related stuff
 *
 * @author Tijs Verkoyen <tijs@sumocoders.be>
 * @author Davy Hellemans <davy.hellemans@netlash.com>
 * @author Dave Lens <dave.lens@wijs.be>
 * @author Dieter Vanden Eynde <dieter.vandeneynde@wijs.be>
 */
class FrontendAJAX extends KernelLoader implements ApplicationInterface
{
	/**
	 * The action
	 *
	 * @var	string
	 */
	private $action;

	/**
	 * @var FrontendAJAXAction
	 */
	private $ajaxAction;

	/**
	 * The language
	 *
	 * @var	string
	 */
	private $language;

	/**
	 * The module
	 *
	 * @var	string
	 */
	private $module;

	/**
	 * Output generated by the action.
	 *
	 * @var array
	 */
	private $output;

	/**
	 * @return Symfony\Component\HttpFoundation\Response
	 */
	public function display()
	{
		return $this->output;
	}

	/**
	 * This method exists because the service container needs to be set before
	 * the request's functionality gets loaded.
	 */
	public function initialize()
	{
		// get vars
		$module = isset($_POST['fork']['module']) ? $_POST['fork']['module'] : '';
		if($module == '' && isset($_GET['module'])) $module = $_GET['module'];
		$action = isset($_POST['fork']['action']) ? $_POST['fork']['action'] : '';
		if($action == '' && isset($_GET['action'])) $action = $_GET['action'];
		$language = isset($_POST['fork']['language']) ? $_POST['fork']['language'] : '';
		if($language == '' && isset($_GET['language'])) $language = $_GET['language'];
		if($language == '') $language = SITE_DEFAULT_LANGUAGE;

		try
		{
			$this->setModule($module);
			$this->setAction($action);
			$this->setLanguage($language);

			$this->ajaxAction = new FrontendAJAXAction($this->getAction(), $this->getModule());
			$this->output = $this->ajaxAction->execute();
		}

		catch(Exception $e)
		{
			$this->ajaxAction = new FrontendBaseAJAXAction('', '');
			$this->ajaxAction->output(FrontendBaseAJAXAction::ERROR, null, $e->getMessage());
			$this->output = $this->ajaxAction->execute();
		}
	}

	/**
	 * Get the loaded action
	 *
	 * @return string
	 */
	public function getAction()
	{
		return $this->action;
	}

	/**
	 * Get the loaded module
	 *
	 * @return string
	 */
	public function getModule()
	{
		return $this->module;
	}

	/**
	 * Set action
	 *
	 * @param string $value The action that should be executed.
	 */
	public function setAction($value)
	{
		// check if module is set
		if($this->getModule() === null) throw new BackendException('Module has not yet been set.');

		// grab the file
		$finder = new Finder();
		$finder->name($value . '.php');
		if($this->getModule() == 'core') $finder->in(FRONTEND_PATH . '/core/ajax/');
		else $finder->in(FRONTEND_PATH . '/modules/' . $this->getModule() . '/ajax/');

		// validate
		if(count($finder->files()) != 1)
		{
			$fakeAction = new FrontendBaseAJAXAction('', '');
			$fakeAction->output(FrontendBaseAJAXAction::BAD_REQUEST, null, 'Action not correct.');
		}

		// set property
		$this->action = (string) $value;
	}

	/**
	 * Set the language
	 *
	 * @param string $value The (interface-)language, will be used to parse labels.
	 */
	public function setLanguage($value)
	{
		// get the possible languages
		$possibleLanguages = FrontendLanguage::getActiveLanguages();

		// validate
		if(!in_array($value, $possibleLanguages))
		{
			// only 1 active language?
			if(!SITE_MULTILANGUAGE && count($possibleLanguages) == 1) $this->language = array_shift($possibleLanguages);

			// multiple languages available but none selected
			else
			{
				throw new BackendException('Language invalid.');
			}
		}

		// language is valid: set property
		else $this->language = (string) $value;

		// define constant
		define('FRONTEND_LANGUAGE', $this->language);

		// set the locale (we need this for the labels)
		FrontendLanguage::setLocale($this->language);
	}

	/**
	 * Set module
	 *
	 * @param string $value The module, wherefore an action will be executed.
	 */
	public function setModule($value)
	{
		// get the possible modules
		$possibleModules = FrontendModel::getModules();

		// validate
		if(!in_array($value, $possibleModules))
		{
			// create fake action
			$fakeAction = new FrontendBaseAJAXAction('', '');

			// output error
			$fakeAction->output(FrontendBaseAJAXAction::BAD_REQUEST, null, 'Module not correct.');
		}

		// set property
		$this->module = (string) $value;
	}
}

/**
 * FrontendAJAXAction
 *
 * @author Tijs Verkoyen <tijs@sumocoders.be>
 * @author Davy Hellemans <davy.hellemans@netlash.com>
 * @author Dieter Vanden Eynde <dieter.vandeneynde@wijs.be>
 */
class FrontendAJAXAction extends FrontendBaseAJAXAction
{
	/**
	 * The current action
	 *
	 * @var	string
	 */
	protected $action;

	/**
	 * The config file
	 *
	 * @var	FrontendBaseConfig
	 */
	protected $config;

	/**
	 * The current module
	 *
	 * @var	string
	 */
	protected $module;

	/**
	 * @param string $action The action that should be executed.
	 * @param string $module The module that wherein the action is available.
	 */
	public function __construct($action, $module)
	{
		// set properties
		$this->setModule($module);
		$this->setAction($action);

		// load the configfile for the required module
		$this->loadConfig();
	}

	/**
	 * Execute the action.
	 * We will build the classname, require the class and call the execute method
	 */
	public function execute()
	{
		// build action-class-name
		$actionClassName = 'Frontend' . SpoonFilter::toCamelCase($this->getModule() . '_ajax_' . $this->getAction());

		// build the path (core is a special case)
		if($this->getModule() == 'core') $path = FRONTEND_PATH . '/core/ajax/' . $this->getAction() . '.php';
		else $path = FRONTEND_PATH . '/modules/' . $this->getModule() . '/ajax/' . $this->getAction() . '.php';

		// check if the config is present? If it isn't present there is a huge problem, so we will stop our code by throwing an error
		if(!is_file($path)) throw new FrontendException('The actionfile (' . $path . ') can\'t be found.');

		// require the ajax file, we know it is there because we validated it before (possible actions are defined by existance of the file).
		require_once $path;

		// validate if class exists
		if(!class_exists($actionClassName)) throw new FrontendException('The actionfile is present, but the classname should be: ' . $actionClassName . '.');

		// create action-object
		$object = new $actionClassName($this->getAction(), $this->getModule());

		// validate if the execute-method is callable
		if(!is_callable(array($object, 'execute'))) throw new FrontendException('The actionfile should contain a callable method "execute".');

		// call the execute method of the real action (defined in the module)
		$object->execute();

		return $object->getContent();
	}

	/**
	 * Get the current action.
	 * REMARK: You should not use this method from your code, but it has to be public so we can access it later on in the core-code.
	 *
	 * @return string
	 */
	public function getAction()
	{
		return $this->action;
	}

	/**
	 * Get the current module.
	 * REMARK: You should not use this method from your code, but it has to be public so we can access it later on in the core-code.
	 *
	 * @return string
	 */
	public function getModule()
	{
		return $this->module;
	}

	/**
	 * Load the config file for the requested module.
	 * In the config file we have to find disabled actions, the constructor will read the folder and set possible actions.
	 * Other configurations will also be stored in it.
	 */
	public function loadConfig()
	{
		// build path for core
		if($this->getModule() == 'core') $frontendModulePath = FRONTEND_PATH . '/' . $this->getModule();

		// build path to the module and define it. This is a constant because we can use this in templates.
		else $frontendModulePath = FRONTEND_MODULES_PATH . '/' . $this->getModule();

		// check if the config is present? If it isn't present there is a huge problem, so we will stop our code by throwing an error
		if(!is_file($frontendModulePath . '/config.php')) {
			throw new FrontendException('The configfile for the module (' . $this->getModule() . ') can\'t be found.');
		}

		// build config-object-name
		$configClassName = 'Frontend' . SpoonFilter::toCamelCase($this->getModule() . '_config');

		// require the config file, we validated before for existence.
		require_once $frontendModulePath . '/config.php';

		// validate if class exists (aka has correct name)
		if(!class_exists($configClassName)) {
			throw new FrontendException('The config file is present, but the classname should be: ' . $configClassName . '.');
		}

		// create config-object, the constructor will do some magic
		$this->config = new $configClassName($this->getModule());
	}

	/**
	 * Set the action
	 *
	 * @param string $action The action that should be executed.
	 */
	protected function setAction($action)
	{
		$this->action = (string) $action;
	}

	/**
	 * Set the module
	 *
	 * @param string $module The module wherin the action is available.
	 */
	protected function setModule($module)
	{
		$this->module = (string) $module;
	}
}
