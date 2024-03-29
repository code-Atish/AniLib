import  { useRef } from "react";
import PropTypes from 'prop-types';
import { TitleCase } from "../../../utility/utilityFunctions";
import InfiniteScroll from "react-infinite-scroll-component";
import { PropagateLoader } from "react-spinners";
import SelectComponent from "../../Select";
import { useState } from "react";
import { getCharacterDetails } from "../../../utility/queries"
import { useQuery } from "@apollo/client";
import { FetchError, NoResults } from "../../../components/Error";

function ImageComponent({ src, alt }) {
  return (
    <div style={{ backgroundColor: "#CDD7E1", objectFit: "cover" }}>
      <img
        className="char_act_image"
        onLoad={(e) => (e.target.style.opacity = 1)}
        src={src}
        alt={alt}
      />
    </div>
  );
}

ImageComponent.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string,
};


function Loader() {
  return (
    <PropagateLoader
      color={"var(--blue-7)"} //Optional color --black-a4
      loading={true}
      cssOverride={{
        display: "flex",
        justifyContent: "center",
        width: "100%",
        height: 20,
        alignItems: "center",
      }}
      size={13}
      aria-label="Loading Spinner"
      data-testid="loader"
    />
  );
}

const CharactersTab = ({ id }) => {
  const languageRef = useRef("JAPANESE");
  const [VALanguage, setVALanguage] = useState("JAPANESE");
  const { loading, error, data, fetchMore } = useQuery(getCharacterDetails, {
    variables: {
      id: id,
      language: VALanguage,
      charPage: 1,
      charPerPage: 15,
    },
  });

  if (loading)
    return (
      <>
        <SelectComponent
          setVALanguage={setVALanguage}
          languageRef={languageRef}
          disabled={true}
        />
        <Loader />
      </>
    );
  if (error) return <FetchError msg={error.message} />

  const characters = data.Page.media[0].characters;
  if (characters.length == 0) return <NoResults />;

  const fetchMoreCharacterData = () => {
    try {
      fetchMore({
        variables: {
          charPage: characters.pageInfo.currentPage + 1,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          const { media } = fetchMoreResult.Page;
          return {
            Page: {
              ...prev.Page,
              media: [
                {
                  ...prev.Page.media[0],
                  characters: {
                    ...prev.Page.media[0].characters,
                    pageInfo: media[0].characters.pageInfo,
                    edges: [
                      ...prev.Page.media[0].characters.edges,
                      ...media[0].characters.edges.map((edge) => {
                        // Ensure 'voiceActors' is present in the edge node
                        if (!edge.node.voiceActors) {
                          //If no voice actor assign empty array
                          edge.node.voiceActors = [];
                        }
                        return edge;
                      }),
                    ],
                  },
                },
              ],
            },
          };
        },
      });
    } catch (error) {
      console.log(error.message);
    }
  };

  return (
    <>
      <SelectComponent
        setVALanguage={setVALanguage}
        languageRef={languageRef}
        disabled={false}
      />
      <InfiniteScroll
        dataLength={characters.edges.length}
        next={fetchMoreCharacterData}
        hasMore={characters.pageInfo.hasNextPage}
        loader={<Loader />}
        endMessage={
          <></>
          // <p style={{ textAlign: "center" }}>Yay! You have seen it all</p>
        }
      >
        <div className="character_list">
          {characters.edges.map(({ role, node, voiceActors }, index) => (
            <div className="character_content_wrapper" key={index}>
              <ImageComponent src={node.image.large} alt={"Character Image"} />
              <div className="character_det_wrapper flex">
                <div className="char_act_name">
                  <div>{node.name.full}</div>
                  <div className="text_left">{voiceActors[0]?.name.full}</div>
                </div>
                <div className="role_language">
                  <div>{TitleCase(role)}</div>
                  <div className="text_left">{voiceActors[0]?.languageV2}</div>
                </div>
              </div>
              {!!voiceActors.length > 0 && (
                <ImageComponent
                  src={voiceActors[0].image.large}
                  alt={"Actor Image"}
                />
              )}
            </div>
          ))}
        </div>
      </InfiniteScroll>
    </>
  );
};

CharactersTab.propTypes = {
  id: PropTypes.number
};
export { CharactersTab, ImageComponent, Loader };
