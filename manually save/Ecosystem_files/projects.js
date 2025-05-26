import {unified} from 'https://esm.sh/unified@11?bundle';
import remarkParse from 'https://esm.sh/remark-parse@11?bundle';
import remarkRehype from 'https://esm.sh/remark-rehype@11?bundle';
import rehypeSanitize from 'https://esm.sh/rehype-sanitize@6?bundle';
import rehypeStringify from 'https://esm.sh/rehype-stringify@10?bundle';
import rehypeExternalLinks from 'https://esm.sh/rehype-external-links@3?bundle';

document.addEventListener("DOMContentLoaded", async () => {
  const apiUrl = "https://playground.oasis.io/projects.json";
  const itemsPerPage = 6;
  let currentPage = 1;
  let allProjects = [];
  let filteredProjects = [];
  let selectedLanguages = [];
  let selectedParatimes = [];
  let selectedLicenses = [];
  let isMaintainedByOasis = false;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    allProjects = await response.json();

    allProjects.sort((a, b) => a.name.localeCompare(b.name));
    filteredProjects = [...allProjects];

    function checkUrlAndOpenModal() {
      // Get the project name from the URL hash (remove the '#' symbol)
      const projectFromUrl = window.location.hash.slice(1); // Remove '#'
      if (projectFromUrl) {
        const project = allProjects.find(
          (p) => p.slug.toLowerCase() === projectFromUrl.toLowerCase()
        );
        if (project) {
          // Scroll to the section of projects
          const section = document.getElementById("developer-demos");
          if (section) {
            section.scrollIntoView({ behavior: "smooth" }); // Scroll smoothly to the section
          }
          openPopup(project); // Open the modal for the project found in the URL
        } else {
          console.log("Project not found in the URL hash.");
        }
      }
    }
    checkUrlAndOpenModal();

    function sanitizeDescription(description) {
      const html = String(
        unified()
          .use(remarkParse)
          .use(remarkRehype)
          .use(rehypeSanitize)
          .use(rehypeExternalLinks, { target: '_blank', properties: { class: 'description-link' } })
          .use(rehypeStringify)
          .processSync(description)
      );
      return html;
    }

    // Extract unique values for filters
    const allLanguages = [
      ...new Set(allProjects.flatMap((project) => project.languages || [])),
    ];
    const allParatimes = [
      ...new Set(allProjects.flatMap((project) => project.paratimes || [])),
    ];
    const allLicenses = [
      ...new Set(allProjects.flatMap((project) => project.license || [])),
    ];

    // Create checkboxes for each language if the container exists
    const languageFiltersContainer =
      document.getElementById("language-filters");
    if (languageFiltersContainer) {
      allLanguages.forEach((language) => {
        const label = document.createElement("label");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = language;
        checkbox.classList.add("language-filter");
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(language));
        languageFiltersContainer.appendChild(label);

        checkbox.addEventListener("change", updateLanguageFilter);
      });
    } else {
      console.error("Language filters container not found");
    }

    // Create checkboxes for each paratime if the container exists
    const paratimeFiltersContainer =
      document.getElementById("paratime-filters");
    if (paratimeFiltersContainer) {
      allParatimes.forEach((paratime) => {
        const label = document.createElement("label");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = paratime;
        checkbox.classList.add("paratime-filter");
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(paratime));
        paratimeFiltersContainer.appendChild(label);

        checkbox.addEventListener("change", updateParatimeFilter);
      });
    } else {
      console.error("Paratime filters container not found");
    }

    // Create checkboxes for each license if the container exists
    const licenseFiltersContainer = document.getElementById("license-filters");
    if (licenseFiltersContainer) {
      allLicenses.forEach((license) => {
        const label = document.createElement("label");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = license;
        checkbox.classList.add("license-filter");
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(license));
        licenseFiltersContainer.appendChild(label);

        checkbox.addEventListener("change", updateLicenseFilter);
      });
    } else {
      console.error("License filters container not found");
    }

    // Create checkbox for 'Maintained by Oasis' if the container exists
    const maintainedFiltersContainer =
      document.getElementById("maintained-filters");
    if (maintainedFiltersContainer) {
      const maintainedCheckbox = document.createElement("input");
      maintainedCheckbox.type = "checkbox";
      maintainedCheckbox.classList.add("maintained-filter");
      const label = document.createElement("label");
      label.appendChild(maintainedCheckbox);
      label.appendChild(document.createTextNode(" Oasis"));
      maintainedFiltersContainer.appendChild(label);

      maintainedCheckbox.addEventListener(
        "change",
        updateMaintainedByOasisFilter
      );
    } else {
      console.error("Maintained filters container not found");
    }

    const container = document.querySelector("#projects-container-list2");
    const loadMoreButton = document.querySelector(".w-pagination-next-list2");
    const searchBar = document.querySelector("#search-bar");
    const clearIcon = document.getElementById("clear-icon");
    const resultsCount = document.getElementById("results-count");

    // Ensure popup section is defined before using it
    const popupSection = document.querySelector(".playground-popup-section");
    const modal = document.querySelector(".playground-modal");

    if (!popupSection || !modal) {
      console.error("Popup section or modal is not found in the DOM");
      return; // Exit early if the modal or popupSection is missing
    }

    const modalFields = {
      name: modal.querySelector(".heading-style-h3"),
      screenshot: modal.querySelector(".playground_demo_screenshot"),
      description: modal.querySelector(".modal_project_description"),
    };

    // Function to update the results count text
    function updateResultsCount() {
      if (filteredProjects.length === 0) {
        resultsCount.textContent = "No Results";
      } else if (filteredProjects.length === 1) {
        resultsCount.textContent = "Showing 1 Result";
      } else {
        resultsCount.textContent = `Showing ${filteredProjects.length} Results`;
      }
    }

    // Function to update filtered projects based on all filters
    function updateFilteredProjects() {
      const searchTerm = searchBar.value.toLowerCase();
      filteredProjects = allProjects.filter((project) => {
        const matchesSearchTerm =
          (project.name && project.name.toLowerCase().includes(searchTerm)) ||
          (project.description &&
            project.description.toLowerCase().includes(searchTerm)) ||
          (project.tags &&
            project.tags.some(
              (tag) => tag && tag.toLowerCase().includes(searchTerm)
            )) ||
          (project.languages &&
            project.languages.some(
              (language) =>
                language && language.toLowerCase().includes(searchTerm)
            )) ||
          (project.paratimes &&
            project.paratimes.some(
              (paratime) =>
                paratime && paratime.toLowerCase().includes(searchTerm)
            )) ||
          (project.authors &&
            project.authors.some((author) => {
              const authorName = Object.keys(author)[0];
              const authorUrl = author[authorName];
              return (
                (authorName && authorName.toLowerCase().includes(searchTerm)) ||
                (authorUrl && authorUrl.toLowerCase().includes(searchTerm))
              );
            }));

        const matchesSelectedLanguages = selectedLanguages.every((language) =>
          project.languages?.includes(language)
        );

        const matchesSelectedParatimes = selectedParatimes.every((paratime) =>
          project.paratimes?.includes(paratime)
        );

        const matchesSelectedLicenses = selectedLicenses.every((license) =>
          project.license?.includes(license)
        );

        const matchesMaintainedByOasis = isMaintainedByOasis
          ? project.maintainedByOasis === true
          : true;

        return (
          matchesSearchTerm &&
          matchesSelectedLanguages &&
          matchesSelectedParatimes &&
          matchesSelectedLicenses &&
          matchesMaintainedByOasis
        );
      });

      // Apply the selected sorting after filtering
      const dropdownButton = document.getElementById("dropdown-button");
      const selectedSort = dropdownButton.textContent.toLowerCase(); // Get the current sorting option text

      sortProjects(selectedSort); // Apply sorting to the filtered list

      currentPage = 1;
      renderProjects(filteredProjects, currentPage);
    }

    // Sorting function
    function sortProjects(sortBy) {
      switch (sortBy) {
        case "created":
          filteredProjects.sort(
            (a, b) => new Date(a.created) - new Date(b.created)
          );
          break;
        case "lastUpdated":
          filteredProjects.sort(
            (a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated)
          );
          break;
        default:
          filteredProjects.sort((a, b) => a.name.localeCompare(b.name)); // Default to sorting by name
          break;
      }
      renderProjects(filteredProjects, currentPage);
    }

    // Function to render projects dynamically
    function renderProjects(projects, page = 1) {
      const start = (page - 1) * itemsPerPage;
      const end = page * itemsPerPage;

      const pageData = projects.slice(start, end);
      if (page === 1) container.innerHTML = "";

      pageData.forEach((project) => {
        const itemWrapper = document.createElement("div");
        itemWrapper.className = "project-item-wrapper";
        itemWrapper.addEventListener("click", () => openPopup(project));

        const item = document.createElement("div");
        item.className = "project-item";

        const name = document.createElement("h4");
        name.className = "project-name";
        name.textContent = project.name;

        const description = document.createElement("p");
        description.className = "project-description";
        description.textContent =
          project.description?.slice(0, 100) +
          (project.description?.length > 100 ? "..." : "");

        const screenshot = document.createElement("img");
        screenshot.className = "project-screenshot thumbnail";
        screenshot.src = "https://playground.oasis.io" + project.screenshots[0];
        screenshot.alt = project.name;

        const languages = document.createElement("p");
        languages.className = `languages-tags`;
        languages.textContent = `Languages: ${
          project.languages?.join(", ") || "N/A"
        }`;

        const tags = document.createElement("p");
        tags.className = `project-tags`;
        tags.textContent = `Tags: ${project.tags?.join(", ") || "N/A"}`;

        const paratimes = document.createElement("p");
        paratimes.className = "project-paratimes";
        const formattedParatimes = `Paratimes: ${
          project.paratimes
            ?.map(
              (paratime) => paratime.charAt(0).toUpperCase() + paratime.slice(1)
            )
            .join(", ") || "N/A"
        }`;
        paratimes.textContent = formattedParatimes;

        const maintainedByOasis = document.createElement("img");
        maintainedByOasis.className = "maintained-by-oasis";
        maintainedByOasis.src =
          "https://cdn.prod.website-files.com/6600cac2bfd894b77d543d34/678eb1569c6375eb0bc8c4c8_maintainedByOasisIconn.svg";
        maintainedByOasis.alt = "maintainedByOasis";

        const bg = document.createElement("div");
        bg.className = "playground-item-bg";

        item.appendChild(screenshot);
        item.appendChild(name);
        item.appendChild(description);
        item.appendChild(languages);
        item.appendChild(tags);
        item.appendChild(paratimes);
        if (project.maintainedByOasis) {
          item.appendChild(maintainedByOasis);
        }
        itemWrapper.appendChild(item);
        itemWrapper.appendChild(bg);
        container.appendChild(itemWrapper);
      });

      loadMoreButton.style.display = end >= projects.length ? "none" : "block";
      updateResultsCount();
    }

    renderProjects(filteredProjects, currentPage);

    loadMoreButton.addEventListener("click", (e) => {
      e.preventDefault();
      currentPage++;
      renderProjects(filteredProjects, currentPage);
    });

    const closeModalButton = document.querySelector(".close_modal_button");
    if (closeModalButton) {
      closeModalButton.addEventListener("click", () => {
        popupSection.classList.remove("active");
      });
    }

    popupSection.addEventListener("click", (e) => {
      if (!modal.contains(e.target)) {
        popupSection.classList.remove("active");
      }
    });

    // Clear icon behavior
    searchBar.addEventListener("input", () => {
      if (searchBar.value.trim() !== "") {
        clearIcon.style.display = "block"; // Show the clear icon
      } else {
        clearIcon.style.display = "none"; // Hide the clear icon
      }
      updateFilteredProjects();
    });

    clearIcon.addEventListener("click", () => {
      searchBar.value = "";
      clearIcon.style.display = "none"; // Hide the clear icon

      filteredProjects = allProjects.filter((project) => {
        const matchesSelectedLanguages = selectedLanguages.every((language) =>
          project.languages?.includes(language)
        );
        const matchesSelectedParatimes = selectedParatimes.every((paratime) =>
          project.paratimes?.includes(paratime)
        );
        const matchesSelectedLicenses = selectedLicenses.every((license) =>
          project.license?.includes(license)
        );
        const matchesMaintainedByOasis = isMaintainedByOasis
          ? project.maintainedByOasis === true
          : true;
        return (
          matchesSelectedLanguages &&
          matchesSelectedParatimes &&
          matchesSelectedLicenses &&
          matchesMaintainedByOasis
        );
      });

      renderProjects(filteredProjects, currentPage);
    });

    searchBar.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        searchBar.value = "";
        clearIcon.style.display = "none";
        filteredProjects = allProjects;
        renderProjects(filteredProjects, currentPage);
      }
    });

    // Define filter update functions
    function updateLanguageFilter() {
      selectedLanguages = Array.from(
        document.querySelectorAll(".language-filter:checked")
      ).map((checkbox) => checkbox.value);
      updateFilteredProjects();
    }

    function updateParatimeFilter() {
      selectedParatimes = Array.from(
        document.querySelectorAll(".paratime-filter:checked")
      ).map((checkbox) => checkbox.value);
      updateFilteredProjects();
    }

    function updateLicenseFilter() {
      selectedLicenses = Array.from(
        document.querySelectorAll(".license-filter:checked")
      ).map((checkbox) => checkbox.value);
      updateFilteredProjects();
    }

    function updateMaintainedByOasisFilter() {
      isMaintainedByOasis =
        document.querySelector(".maintained-filter").checked;
      updateFilteredProjects();
    }

    // Dropdown toggle logic for sorting
    const dropdownButton = document.getElementById("dropdown-button");
    const dropdownMenu = document.getElementById("dropdown-menu");

    dropdownButton.addEventListener("click", () => {
      dropdownMenu.classList.toggle("active"); // Toggle dropdown visibility
    });

    const dropdownItems = dropdownMenu.querySelectorAll(".dropdown-item");
    dropdownItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        const sortBy = e.target.getAttribute("data-value");
        dropdownButton.textContent = e.target.textContent; // Update button text to selected option

        // Apply sorting
        sortProjects(sortBy);

        // Close dropdown
        dropdownMenu.classList.remove("active");
      });
    });

    function openPopup(project) {
      const popupSection = document.querySelector(".playground-popup-section");
      const modal = document.querySelector(".playground-modal");
      const modalFields = {
        name: modal.querySelector(".heading-style-h3"),
        screenshot: modal.querySelector(".playground_demo_screenshot"),
        description: modal.querySelector(".modal_project_description"),
        authors: modal.querySelector(
          ".playground_modal_list .playground_right_list_item:nth-child(1) .text-span-113"
        ),
        github: modal.querySelector(
          ".playground_modal_list .playground_right_list_item:nth-child(2) a"
        ),
        demo: modal.querySelector(
          ".playground_modal_list .playground_right_list_item:nth-child(3) a"
        ),
        tutorial: modal.querySelector(
          ".playground_modal_list .playground_right_list_item:nth-child(4) a"
        ),
        license: modal.querySelector(
          ".playground_modal_list .playground_right_list_item:nth-child(5) .text-span-113"
        ),
        paratimes: modal.querySelector(".playground_cat_value_paratimes"),
        languages: modal.querySelector(".playground_cat_value_languages"),
        created: modal.querySelector(".playground_cat_value_created"),
        lastUpdated: modal.querySelector(".playground_cat_value_updated"),
        tagsWrapper: modal.querySelector(".playground_tags_wrapper"),
      };

      modalFields.name.textContent = project.name;
      modalFields.screenshot.src =
        "https://playground.oasis.io" + project.screenshots[0];
      modalFields.screenshot.alt = project.name;

      // Sanitize and insert the project description
      modalFields.description.innerHTML = sanitizeDescription(
        project.description || "No description available."
      );

      // Populate Authors with links
      if (project.authors && project.authors.length > 0) {
        const authorsHTML = project.authors
          .map((author) => {
            const authorName = Object.keys(author)[0];
            const authorUrl = author[authorName];
            return `<a href="${authorUrl}" target="_blank" class="author-link">${authorName}</a>`;
          })
          .join(", ");
        modalFields.authors.innerHTML = authorsHTML;
      }

      // GitHub Link: Check if project.github exists
      if (project.codeUrl) {
        modalFields.github.href = project.codeUrl; // Set the GitHub URL
        modalFields.github.textContent = "Link to GitHub"; // Set the link text
        modalFields.github.setAttribute("target", "_blank"); // Ensure it opens in a new tab
        modalFields.github.style.display = "inline"; // Show the GitHub link if available
      } else {
        document.querySelector(".playground_modal_code").style.display = "none";
      }

      // Demo Link: Check if project.demoUrl exists
      if (project.demoUrl) {
        modalFields.demo.href = project.demoUrl; // Set the demo URL
        modalFields.demo.textContent = "View Demo"; // Set the demo link text
        modalFields.demo.setAttribute("target", "_blank"); // Ensure it opens in a new tab
        modalFields.demo.style.display = "inline"; // Show the demo link if available
      } else {
        document.querySelector(".playground_modal_demo").style.display = "none";
      }

      if (modalFields.tutorial) {
        modalFields.tutorial.href =
          project.tutorials && project.tutorials[0]
            ? project.tutorials[0][Object.keys(project.tutorials[0])[0]]
            : "#";
        modalFields.tutorial.textContent =
          project.tutorials && project.tutorials[0] ? "Video Demo" : "N/A";
        modalFields.tutorial.setAttribute("target", "_blank");
      } else {
        modalFields.tutorial.style.display = "none";
      }

      modalFields.license.textContent = project.license || "Unspecified";

      // Populate ParaTimes
      modalFields.paratimes.textContent = project.paratimes
        ? project.paratimes.join(", ")
        : "N/A";

      // Populate Languages
      modalFields.languages.textContent = project.languages
        ? project.languages.join(", ")
        : "N/A";

      // Populate Created and Last Updated
      modalFields.created.textContent = project.created
        ? new Date(project.created).toLocaleDateString()
        : "N/A";
      modalFields.lastUpdated.textContent = project.lastUpdated
        ? new Date(project.lastUpdated).toLocaleDateString()
        : "N/A";

      // Populate Tags
      modalFields.tagsWrapper.innerHTML = ""; // Clear any existing tags
      if (project.tags && project.tags.length > 0) {
        project.tags.forEach((tag) => {
          const tagElement = document.createElement("div");
          tagElement.className = "playground_tag";
          tagElement.innerHTML = `<div class="playground_cat_value playground_cat_value_tag">${tag}</div>`;
          modalFields.tagsWrapper.appendChild(tagElement);
        });
      } else {
        const tagElement = document.createElement("div");
        tagElement.className = "playground_tag";
        tagElement.innerHTML = `<div class="playground_cat_value playground_cat_value_tag">N/A</div>`;
        modalFields.tagsWrapper.appendChild(tagElement);
      }

      // Add the project name to the URL
      history.pushState(
        null,
        null,
        `#${project.slug}`
      );
      // Show the popup modal
      popupSection.classList.add("active");
    }

    // Select the clear filters button
    const clearFiltersButton = document.querySelector(
      ".clear-filters-playground"
    );

    // Function to clear all filters and reset the search bar
    clearFiltersButton.addEventListener("click", () => {
      // Reset checkboxes for all filters
      document
        .querySelectorAll(".language-filter")
        .forEach((checkbox) => (checkbox.checked = false));
      document
        .querySelectorAll(".paratime-filter")
        .forEach((checkbox) => (checkbox.checked = false));
      document
        .querySelectorAll(".license-filter")
        .forEach((checkbox) => (checkbox.checked = false));
      document.querySelector(".maintained-filter").checked = false; // Reset the 'Maintained by Oasis' filter

      // Reset the search bar and hide the clear icon
      searchBar.value = "";
      clearIcon.style.display = "none";

      // Reset filter state variables
      selectedLanguages = [];
      selectedParatimes = [];
      selectedLicenses = [];
      isMaintainedByOasis = false;

      // Re-filter projects and re-render the list
      updateFilteredProjects(); // This will update the project list based on the reset filters
    });

    if (closeModalButton) {
      closeModalButton.addEventListener("click", () => {
        const popupSection = document.querySelector(
          ".playground-popup-section"
        );
        popupSection.classList.remove("active");

        // Remove the project name from the URL
        history.replaceState(null, null, window.location.pathname); // This will reset the URL to its original form without the hash
      });
    }

    popupSection.addEventListener("click", (e) => {
      if (!modal.contains(e.target)) {
        const popupSection = document.querySelector(
          ".playground-popup-section"
        );
        popupSection.classList.remove("active");

        // Remove the project name from the URL when clicking outside the modal
        history.replaceState(null, null, window.location.pathname); // Reset the URL to its original form
      }
    });
  } catch (error) {
    console.error("Error fetching or displaying data:", error);
  }
});
